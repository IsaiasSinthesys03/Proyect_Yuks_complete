/**
 * Gamificación (Fase 43, REQ-FE-14) — progreso del "Pase de Leyenda".
 *
 * Los UMBRALES vienen de `system_settings` vía GET /api/profile
 * (`gamification: { silverThreshold, goldThreshold, platinumThreshold }`);
 * nada está hardcodeado. La escalera real de tiers del backend es
 * BRONZE → SILVER → GOLD → PLATINUM; los nombres de rango visibles usan
 * el lore del prototipo (Jaguar/Kukul).
 */

const TIER_DISPLAY = {
    BRONZE: { label: 'Rango Bronce', emoji: '🥉' },
    SILVER: { label: 'Rango Plata', emoji: '🥈' },
    GOLD: { label: 'Rango Jaguar', emoji: '🐆' },
    PLATINUM: { label: 'Rango Kukul', emoji: '🐍' },
};

export function tierDisplay(tierLevel) {
    return TIER_DISPLAY[tierLevel] ?? TIER_DISPLAY.BRONZE;
}

/**
 * Calcula el progreso hacia el siguiente tier.
 * @returns { current, target, pct, nextTierLabel, isMax, label }
 */
export function tierProgress(experiencePoints, tierLevel, gamification) {
    const xp = experiencePoints ?? 0;
    const silver = gamification?.silverThreshold ?? 1000;
    const gold = gamification?.goldThreshold ?? 5000;
    const platinum = gamification?.platinumThreshold ?? 20000;

    // Escalera: [piso del tier actual, techo (siguiente tier)]
    const ladder = {
        BRONZE: { floor: 0, ceil: silver, next: 'SILVER' },
        SILVER: { floor: silver, ceil: gold, next: 'GOLD' },
        GOLD: { floor: gold, ceil: platinum, next: 'PLATINUM' },
        PLATINUM: { floor: platinum, ceil: platinum, next: null },
    };
    const rung = ladder[tierLevel] ?? ladder.BRONZE;

    if (!rung.next) {
        return { current: xp, target: platinum, pct: 100, nextTierLabel: null, isMax: true, missing: 0 };
    }

    const span = Math.max(1, rung.ceil - rung.floor);
    const pct = Math.min(100, Math.max(0, ((xp - rung.floor) / span) * 100));
    return {
        current: xp,
        target: rung.ceil,
        pct,
        nextTierLabel: TIER_DISPLAY[rung.next].label,
        isMax: false,
        missing: Math.max(0, rung.ceil - xp),
    };
}
