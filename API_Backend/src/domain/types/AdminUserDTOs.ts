// ==========================================
// Fase 24 — DTOs para CRM admin de usuarios
// ==========================================

export interface AdminUserFilterDTO {
  page?: number;
  limit?: number;
}

/**
 * Fila segura del CRM administrativo.
 *
 * Nunca debe sustituirse por la entidad `User`: esa entidad contiene el hash
 * de contraseña y otros campos de autenticación que no pertenecen al contrato
 * HTTP del CMS.
 */
export interface AdminUserCrmDTO {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
  privacyAcceptedAt: Date | null;
  isBanned: boolean;
  walletBalance: number;
  walletExpiresAt: Date | null;
  ticketCount: number;
  purchaseTotal: number;
}

/** Respuesta mínima de las acciones de suspensión y reversión. */
export interface AdminUserBanStatusDTO {
  id: string;
  isBanned: boolean;
}
