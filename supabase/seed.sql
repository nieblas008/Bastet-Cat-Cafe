-- ════════════════════════════════════════════════════════════════════
-- DATOS DE EJEMPLO · SOLO PARA DESARROLLO LOCAL
--
-- Gatos, menú, horario, niveles y lista de deseos INVENTADOS, los mismos
-- del prototipo de Claude Design. Fotos de Unsplash (licencia libre).
-- `supabase db reset` los carga en local. NO se corren en producción:
-- en producción el personal captura todo desde /panel.
-- ════════════════════════════════════════════════════════════════════

-- Horario de ejemplo
update public.weekly_schedule set is_open = true, opens_at = '12:00', closes_at = '20:00', note = null where day_of_week in (1, 2, 4);
update public.weekly_schedule set is_open = false, opens_at = null, closes_at = null, note = 'Día de descanso' where day_of_week = 3;
update public.weekly_schedule set is_open = true, opens_at = '12:00', closes_at = '21:00' where day_of_week = 5;
update public.weekly_schedule set is_open = true, opens_at = '11:00', closes_at = '21:00' where day_of_week = 6;
update public.weekly_schedule set is_open = true, opens_at = '11:00', closes_at = '19:00' where day_of_week = 0;

update public.page_blocks set body = $$- Lávate las manos al llegar.
- Deja que los gatos se acerquen a ti; no los cargues.
- No les des de tu comida.
- Si un gato está dormido, déjalo dormir.$$ where key = 'inicio_primera_visita';

-- Menú de ejemplo
insert into public.menu_categories (id, name, slug, icon, sort_order) values
  ('00000000-0000-0000-0000-0000000000c1', 'Café', 'cafe', 'coffee', 1),
  ('00000000-0000-0000-0000-0000000000c2', 'Té & matcha', 'te-matcha', 'tea', 2),
  ('00000000-0000-0000-0000-0000000000c3', 'Bebidas frías', 'bebidas-frias', 'cold', 3),
  ('00000000-0000-0000-0000-0000000000c4', 'Pan dulce', 'pan-dulce', 'bread', 4),
  ('00000000-0000-0000-0000-0000000000c5', 'Para el antojo salado', 'salado', 'salty', 5);

insert into public.menu_items (category_id, name, description, price_mxn, price_note, badge, dietary_tags, sort_order) values
  ('00000000-0000-0000-0000-0000000000c1', 'Café de olla', 'Canela y piloncillo, servido en jarrito', 50, null, 'favorito de la casa', '{}', 1),
  ('00000000-0000-0000-0000-0000000000c1', 'Espresso doble', 'Grano de Chiapas, tueste medio', 40, null, null, '{}', 2),
  ('00000000-0000-0000-0000-0000000000c1', 'Americano', null, 48, null, null, '{}', 3),
  ('00000000-0000-0000-0000-0000000000c1', 'Latte', 'Leche entera o vegetal', 65, 'avena +$10', null, '{lacteos}', 4),
  ('00000000-0000-0000-0000-0000000000c1', 'Capuchino', null, 62, null, null, '{lacteos}', 5),
  ('00000000-0000-0000-0000-0000000000c1', 'Cold brew', '16 horas de extracción en frío', 68, null, null, '{}', 6),
  ('00000000-0000-0000-0000-0000000000c2', 'Matcha latte', 'Ceremonial, frío o caliente', 75, null, null, '{lacteos}', 1),
  ('00000000-0000-0000-0000-0000000000c2', 'Chai latte', 'Especias molidas en casa', 68, null, null, '{lacteos}', 2),
  ('00000000-0000-0000-0000-0000000000c3', 'Agua de jamaica', 'Endulzada ligerito', 40, null, null, '{vegano}', 1),
  ('00000000-0000-0000-0000-0000000000c3', 'Soda italiana', 'Frutos rojos o maracuyá', 58, null, null, '{vegano}', 2),
  ('00000000-0000-0000-0000-0000000000c4', 'Concha de vainilla', 'De panadería local', 35, null, 'llega diario', '{vegetariano}', 1),
  ('00000000-0000-0000-0000-0000000000c4', 'Galleta huellita', 'Mantequilla con huellita de chocolate', 30, null, null, '{vegetariano,lacteos}', 2),
  ('00000000-0000-0000-0000-0000000000c5', 'Chapata de pesto y panela', 'Con jitomate deshidratado', 95, null, null, '{vegetariano,lacteos,nueces}', 1),
  ('00000000-0000-0000-0000-0000000000c5', 'Bagel de aguacate', 'Ajonjolí, limón y hojuelas de chile', 80, null, null, '{vegano}', 2);

-- Gatos de ejemplo
insert into public.cats (id, slug, name, status, sex, age_label, arrived_at, short_bio, personality, traits,
  vaccinated, sterilized, dewormed, good_with_kids, good_with_dogs, good_with_cats, featured, published, sort_order) values
  ('00000000-0000-0000-0000-00000000a001', 'frijolita', 'Frijolita', 'disponible', 'hembra', '1 año', '2026-03-10',
   'Llegó una noche de lluvia y a la semana ya supervisaba la barra.',
   'Llegó una noche de lluvia, chiquita y enojada, y a la semana ya supervisaba la barra desde el estante de los jarritos. Ronronea fuerte y opina de todo.',
   '{apapachadora,curiosa}', true, true, true, true, true, null, true, true, 1),
  ('00000000-0000-0000-0000-00000000a002', 'tamal', 'Tamal', 'disponible', 'macho', '3 años', '2026-01-20',
   'Duerme en el estante de las tazas y nadie se atreve a moverlo.', null,
   '{tranquilo,dormilón}', true, true, true, true, null, true, false, true, 2),
  ('00000000-0000-0000-0000-00000000a003', 'nube', 'Nube', 'apartado', 'hembra', '8 meses', '2026-06-02',
   'Cero miedo y mucha energía: persigue plumas, sombras y tus agujetas.', null,
   '{juguetona,traviesa}', true, true, true, null, true, true, false, true, 3),
  ('00000000-0000-0000-0000-00000000a004', 'luna', 'Luna', 'disponible', 'hembra', '8 años', '2025-11-15',
   'Una dama mayor que solo pide una ventana soleada y cariño sin prisa.', null,
   '{serena,sabia}', true, true, true, true, null, null, false, true, 4),
  ('00000000-0000-0000-0000-00000000a005', 'ramses', 'Ramsés', 'residente', 'macho', '5 años', '2024-05-01',
   'El fundador. Recibe a la clientela desde su cojín, como el faraón que es.', null,
   '{serio,observador}', true, true, true, null, null, true, false, true, 5),
  ('00000000-0000-0000-0000-00000000a006', 'motita', 'Motita', 'en_tratamiento', 'hembra', '4 meses', '2026-09-30',
   'Se recupera de una gripita felina. Pronto estará lista para buscar casa.', null,
   '{dormilona,valiente}', false, false, true, null, null, true, false, true, 6);

insert into public.cat_photos (cat_id, storage_path, alt, sort_order) values
  ('00000000-0000-0000-0000-00000000a001', 'https://images.unsplash.com/photo-1592194996308-7b43878e84a6?auto=format&fit=crop&w=900&q=72', 'Gata gris de ojos amarillos', 0),
  ('00000000-0000-0000-0000-00000000a002', 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=900&q=72', 'Gato atigrado', 0),
  ('00000000-0000-0000-0000-00000000a003', 'https://images.unsplash.com/photo-1574158622682-e40e69881006?auto=format&fit=crop&w=900&q=72', 'Gatita jugando', 0),
  ('00000000-0000-0000-0000-00000000a004', 'https://images.unsplash.com/photo-1511044568932-338cba0ad803?auto=format&fit=crop&w=900&q=72', 'Gata mayor descansando', 0),
  ('00000000-0000-0000-0000-00000000a005', 'https://images.unsplash.com/photo-1573865526739-10659fec78a5?auto=format&fit=crop&w=900&q=72', 'Gato naranja mirando hacia arriba', 0),
  ('00000000-0000-0000-0000-00000000a006', 'https://images.unsplash.com/photo-1529778873920-4da4926a72c2?auto=format&fit=crop&w=900&q=72', 'Gatita atigrada', 0);

-- Niveles de apadrinamiento de ejemplo
insert into public.sponsorship_tiers (name, monthly_mxn, description, perks, sort_order) values
  ('Bigotes', 150, 'Ayuda con la comida del mes.', '{"Foto mensual de tu michi"}', 1),
  ('Patitas', 300, 'Comida y arena del mes.', '{"Foto mensual de tu michi","Videos exclusivos"}', 2),
  ('Corona de Bastet', 600, 'Comida, arena y visita al veterinario.', '{"Foto mensual de tu michi","Videos exclusivos","Tu nombre en el muro de padrinos"}', 3);

-- Lista de deseos de ejemplo
insert into public.wishlist_items (name, description, priority, quantity_needed, quantity_received, sort_order) values
  ('Arena aglomerante', 'Bolsas de 10 kg, sin aroma', 'urgente', 10, 3, 1),
  ('Alimento para gatito', 'Croquetas para menores de un año', 'normal', 6, 1, 2),
  ('Rascadores', null, 'cuando_se_pueda', 2, 0, 3);

-- Entrada de blog de ejemplo
insert into public.posts (slug, title, excerpt, body, category, status, pinned) values
  ('por-que-esterilizar', '¿Por qué esterilizar?', 'Una sola gata sin esterilizar puede cambiar una colonia entera.',
   E'Texto de ejemplo. Esta entrada la reemplaza el equipo desde el panel.\n\n## Lo básico\n\nA los 4 meses una gatita ya puede quedar embarazada.',
   'concientizacion', 'publicado', true);
