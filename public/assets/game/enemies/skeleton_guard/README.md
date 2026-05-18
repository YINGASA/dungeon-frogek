# skeleton_guard

Future skeleton guard sheets. Use names such as `skeleton_guard_idle.png`, `skeleton_guard_move.png`, `skeleton_guard_attack.png`, `skeleton_guard_hurt.png`, and `skeleton_guard_death.png`.

Recommended frame size: 32x32, or 48x48 if the silhouette needs a clearer shield or weapon.

Animations should preserve the current enemy readability and gameplay timing. Attack windup visuals should line up with the existing AI behavior without changing speed, damage, health, collision, or reward logic.

V1.5.3 uses generated fallback visuals for guard identity, weapon windup, hit flash, and bone-piece death feedback. Formal sprite sheets should keep melee threat clear without changing attack range or cadence.
