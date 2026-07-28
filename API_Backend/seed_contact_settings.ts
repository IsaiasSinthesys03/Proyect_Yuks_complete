import { db } from './src/infrastructure/database/client';

async function seed() {
    console.log('Seeding contact settings...');
    
    const settings = [
        { key: 'social_facebook_url', value: JSON.stringify('https://facebook.com') },
        { key: 'social_instagram_url', value: JSON.stringify('https://instagram.com') },
        { key: 'social_twitter_url', value: JSON.stringify('https://twitter.com') },
        { key: 'support_whatsapp', value: JSON.stringify('+52 999 123 4567') },
        { key: 'support_email', value: JSON.stringify('hola@animayuks.com') }
    ];

    for (const s of settings) {
        await db.insertInto('system_settings')
            .values(s)
            .onConflict((oc) => oc.column('key').doNothing())
            .execute();
    }
    
    console.log('Done!');
    process.exit(0);
}

seed().catch(console.error);
