import 'dotenv/config';
import jwt from 'jsonwebtoken';
import { Pool } from 'pg';

const API = process.env.E2E_API_URL || 'http://127.0.0.1:3000';
const pool = new Pool({ connectionString: process.env.DATABASE_URL, statement_timeout: 10_000 });
const createdUserIds: string[] = [];
let createdAdminId: string | null = null;
let createdCustomerId: string | null = null;

async function api(path: string, token: string, init: RequestInit = {}) {
  const response = await fetch(`${API}${path}`, {
    ...init,
    headers: { 'content-type': 'application/json', authorization: `Bearer ${token}`, ...init.headers },
  });
  const body = await response.json().catch(() => null);
  return { status: response.status, body };
}

async function createPrincipal(email: string, role: 'ADMIN' | 'CUSTOMER') {
  const result = await pool.query<{ id: string }>(
    `insert into users (email, password_hash, role, privacy_accepted, privacy_accepted_at)
     values ($1, 'e2e-not-used', $2, true, now()) returning id`,
    [email, role]
  );
  const id = result.rows[0].id;
  createdUserIds.push(id);
  const token = jwt.sign({ sub: id, email, role }, process.env.JWT_SECRET!, { expiresIn: '15m' });
  return { id, token };
}

async function createAddress(userId: string, country: string, state: string) {
  const result = await pool.query<{ id: string }>(
    `insert into addresses
      (user_id, label, street, exterior_number, neighborhood, postal_code, municipality, state, country)
     values ($1, 'E2E', 'Coverage Street', '1', 'Coverage', '00000', 'Coverage City', $2, $3)
     returning id`,
    [userId, state, country]
  );
  return result.rows[0].id;
}

async function main() {
  console.log('Preparando estado aislado E2E…');
  // Recuperación idempotente si una ejecución anterior fue interrumpida.
  await pool.query(`delete from users where email like 'shipping.customer.%@animayuks.test'`);
  await pool.query(`update users set is_banned = true where email like 'shipping.admin.%@animayuks.test'`);
  await pool.query(
    `update system_settings set value = '[]'::jsonb, updated_at = now()
     where key in ('blocked_shipping_continents','blocked_shipping_countries','blocked_shipping_regions')`
  );
  await pool.query(
    `update system_settings
     set value = to_jsonb('Lo sentimos, por el momento no podemos realizar entregas en la zona de tu domicilio. Esperamos ampliar nuestra cobertura muy pronto.'::text),
         updated_at = now()
     where key = 'shipping_unavailable_message'`
  );
  const stamp = Date.now();
  console.log('Creando identidades temporales…');
  const admin = await createPrincipal(`shipping.admin.${stamp}@animayuks.test`, 'ADMIN');
  const customer = await createPrincipal(`shipping.customer.${stamp}@animayuks.test`, 'CUSTOMER');
  createdAdminId = admin.id;
  createdCustomerId = customer.id;
  const previous = await api('/api/admin/settings', admin.token);
  if (previous.status !== 200) throw new Error(`GET settings falló: ${previous.status} ${JSON.stringify(previous.body)}`);

  const message = 'Lo sentimos, todavía no podemos entregar pedidos en esta zona de tu domicilio.';
  const update = await api('/api/admin/settings', admin.token, {
    method: 'PUT',
    body: JSON.stringify({
      blockedContinents: ['AS'],
      blockedCountries: ['US'],
      blockedRegions: [{ countryCode: 'MX', region: 'Quintana Roo' }],
      shippingUnavailableMessage: message,
    }),
  });
  if (update.status !== 200) throw new Error(`PUT settings falló: ${update.status} ${JSON.stringify(update.body)}`);
  console.log('PASS política guardada por API administrativa');

  const destinations = [
    { name: 'continente Asia', addressId: await createAddress(customer.id, 'JP', 'Tokyo'), reason: 'CONTINENT' },
    { name: 'país Estados Unidos', addressId: await createAddress(customer.id, 'US', 'Texas'), reason: 'COUNTRY' },
    { name: 'región Quintana Roo', addressId: await createAddress(customer.id, 'MX', 'Quintana Roo'), reason: 'REGION' },
  ];

  for (const destination of destinations) {
    const result = await api('/api/checkout/coverage', customer.token, {
      method: 'POST',
      body: JSON.stringify({ addressId: destination.addressId }),
    });
    if (
      result.status !== 422 ||
      result.body?.code !== 'SHIPPING_DESTINATION_UNAVAILABLE' ||
      result.body?.reason !== destination.reason ||
      result.body?.message !== message
    ) throw new Error(`${destination.name} no fue bloqueado correctamente: ${JSON.stringify(result)}`);
    console.log(`PASS ${destination.name}: 422 ${destination.reason}`);
  }

  const allowedId = await createAddress(customer.id, 'MX', 'Yucatán');
  const allowed = await api('/api/checkout/coverage', customer.token, {
    method: 'POST',
    body: JSON.stringify({ addressId: allowedId }),
  });
  if (allowed.status !== 200 || allowed.body?.data?.available !== true) {
    throw new Error(`Destino permitido fue bloqueado: ${JSON.stringify(allowed)}`);
  }
  console.log('PASS destino permitido: 200 available=true');

  const data = previous.body.data;
  await api('/api/admin/settings', admin.token, {
    method: 'PUT',
    body: JSON.stringify({
      blockedContinents: data.blockedContinents,
      blockedCountries: data.blockedCountries,
      blockedRegions: data.blockedRegions,
      shippingUnavailableMessage: data.shippingUnavailableMessage,
    }),
  });
  console.log('PASS política original restaurada');
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    // Los audit_logs son inmutables y conservan la referencia del admin E2E.
    // Se elimina el cliente (cascade de direcciones) y se suspende el admin.
    if (createdCustomerId) await pool.query('delete from users where id = $1', [createdCustomerId]);
    if (createdAdminId) await pool.query('update users set is_banned = true where id = $1', [createdAdminId]);
    await pool.end();
  });
