# Bastet Cat Café — app web

Sitio público, panel del equipo (`/panel`) y portal de padrinos (`/padrino`).
Next.js 16 (App Router) + Supabase (base de datos, cuentas y fotos) + Vercel.

## Qué hay

| Ruta | Para quién | Qué hace |
|---|---|---|
| `/`, `/gatos`, `/adoptar`, `/menu`, `/visitanos`, `/nosotros`, `/blog`, `/concientizacion`, `/apadrina`, `/ayudar`, `/contacto` | Público | El sitio. Todo el contenido sale de la base de datos. |
| `/panel` | Equipo del café | Gatos y fotos, horario y días especiales, menú (con "agotado"), solicitudes de adopción, seguimiento post-adopción, blog y eventos, padrinos y pagos, lista de necesidades, mensajes, textos del sitio, datos del café, QR, equipo e historial de cambios. |
| `/padrino` | Padrinos | Crear cuenta, pedir apadrinar, ver datos para pagar y las fotos/videos privados de su gato. |

La base de datos está en `../supabase/migrations` (5 migraciones, ya aplicadas al proyecto `cdkqbfhqebgkenrmhpzd`).
`../supabase/seed.sql` trae datos **de ejemplo** solo para desarrollo local; no lo corras en producción.

Fuera de este pase: kiosko/iPads para pedir en el café y cobro con tarjeta en línea.

## Correrlo local

```bash
cd web
cp .env.example .env.local   # y llena las llaves
npm install
npm run dev
```

## Publicar en Vercel

1. Importa el repo en Vercel y pon **Root Directory = `web`**.
2. Variables de entorno: las cuatro de `.env.example`. `SUPABASE_SECRET_KEY` sin `NEXT_PUBLIC_`.
3. En Supabase → **Authentication → URL Configuration**:
   - **Site URL:** la dirección final (p. ej. `https://bastetcatcafe.com`).
   - **Redirect URLs:** agrega `https://<tu-dominio>/auth/confirm` y, para previews, `https://*.vercel.app/auth/confirm`.
4. (Opcional) Supabase → **Authentication → Providers → Email**: si desactivas "Confirm email", los padrinos entran
   al crear su cuenta sin esperar el correo.

## Primera administradora

Las cuentas del equipo se crean desde `/panel/equipo`, pero la primera hay que hacerla a mano:

1. Supabase → **Authentication → Users → Add user** con su correo y una contraseña (marca "Auto confirm").
2. En **SQL Editor**:
   ```sql
   update public.profiles set role = 'admin', full_name = 'Elizabeth Barajas'
   where email = 'correo@ejemplo.com';
   ```
3. Entra a `/panel/entrar`. Desde **Equipo** ya puedes crear enlaces de acceso para los demás
   (se mandan por WhatsApp; sirven una vez y caducan en 24 h).

## Cómo funciona por dentro

- **Permisos:** todo lo controla Row Level Security en Postgres. Roles: `admin`, `staff`, `padrino`.
  Cualquier cuenta nueva es `padrino`; solo una admin cambia roles. El público solo puede *insertar*
  solicitudes y mensajes, nunca leerlos.
- **Fotos:** se comprimen en el navegador (WebP, 1600 px) y se suben directo a Storage.
  Bucket `publico` (gatos, menú, blog) y bucket privado `padrinos` (se sirve con URLs firmadas).
- **Contador de adopciones:** sube solo cuando un gato pasa a "adoptado" (trigger en la base de datos).
  "Apartado" pone `reserved_until` a 7 días.
- **Historial:** cada cambio del panel queda en `audit_log` con quién lo hizo.
- **Caché:** las páginas públicas se regeneran cada 5 min y al instante cuando el panel guarda algo.
- Textos del sitio: un bloque sin texto no se muestra. Así no se publica nada sin confirmar.

## Comandos

```bash
npx next typegen && npx tsc --noEmit   # tipos
npm run lint
npm run build
```
