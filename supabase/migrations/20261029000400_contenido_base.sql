-- ════════════════════════════════════════════════════════════════════
-- Contenido base: solo datos CONFIRMADOS por el cliente (wiki, reunión 1).
-- Nada inventado aquí. Los textos vacíos no se muestran en el sitio
-- hasta que el personal los llene desde el panel.
-- Los datos de ejemplo para desarrollo están en supabase/seed.sql.
-- ════════════════════════════════════════════════════════════════════

update public.site_settings set
  phone                 = '(664) 526 6353',
  instagram_url         = 'https://www.instagram.com/bastetcatcafe',
  adoption_fee_mxn      = 800,
  adoptions_count       = 2000,
  adoptions_count_as_of = '2026-08-20',
  adoptions_goal        = 10000
where id = 1;

-- Los seis requisitos, tal como los dieron en la reunión 1
insert into public.adoption_requirements (title, description, sort_order) values
  ('Identificación oficial', null, 1),
  ('Comprobante de domicilio', null, 2),
  ('Llenar el formato de adopción', null, 3),
  ('Entrevista con alguien del equipo', 'Dura entre 30 y 40 minutos.', 4),
  ('Transportadora', 'Para que el gato viaje seguro a su nueva casa.', 5),
  ('Cuota de recuperación', 'Cubre vacunas, esterilización, desparasitación y baños.', 6);

-- Datos que quieren difundir (reunión 1)
insert into public.awareness_facts (headline, body, sort_order) values
  ('A los 4 meses', 'Una gatita puede quedar embarazada a los 4 meses de nacida.', 1),
  ('Un mes después', 'Puede volver a quedar embarazada al mes de haber parido.', 2),
  ('De 3 a 6 gatitos', 'Cada camada es de entre 3 y 6 gatitos.', 3),
  ('La calle es peligrosa', 'Un gato en la calle está expuesto a la gente, a enfermedades y a morir por lo que llega a comer.', 4);

-- Bloques de texto editables. Se crean vacíos: el contenido lo escriben ellas.
insert into public.page_blocks (key, label, page, title, body, sort_order) values
  ('inicio_hero',            'Portada: frase principal',            'inicio',          'Ven por el café. Quédate por los michis.', 'Café de especialidad y refugio felino en Tijuana. Los gatos que conoces aquí están buscando familia.', 1),
  ('inicio_primera_visita',  '¿Primera vez en un cat café?',        'inicio',          '¿Primera vez en un cat café?', '', 2),
  ('nosotros_historia',      'Nosotros: quiénes somos',             'nosotros',        'Quiénes somos', '', 1),
  ('nosotros_como_llegan',   'Nosotros: cómo llegan los gatos',     'nosotros',        'Cómo llegan los gatos', 'No salimos a rescatar: recibimos gatos de personas que rescatan por su cuenta y de organizaciones de rescate. Aquí los cuidamos, los vacunamos, los esterilizamos y les buscamos un hogar.', 2),
  ('nosotros_meta',          'Nosotros: la meta',                   'nosotros',        'Rumbo a 10,000 adopciones', '', 3),
  ('visita_reglas',          'Visítanos: cómo funciona la visita',  'visitanos',       'Cómo funciona una visita', '', 1),
  ('visita_como_llegar',     'Visítanos: cómo llegar y estacionamiento', 'visitanos',  'Cómo llegar', '', 2),
  ('visita_accesibilidad',   'Visítanos: accesibilidad del lugar',  'visitanos',       'Accesibilidad', '', 3),
  ('adoptar_intro',          'Adoptar: introducción',               'adoptar',         'Adoptar en Bastet', 'Buscamos un hogar que aguante los años que vienen, no solo el día de hoy. Por eso hay requisitos y una entrevista.', 1),
  ('adoptar_proceso',        'Adoptar: el proceso paso a paso',     'adoptar',         'Así es el proceso', '', 2),
  ('adoptar_periodo_gracia', 'Adoptar: periodo de gracia',          'adoptar',         'Si te falta algún requisito', 'Si pasas la entrevista y te falta algún requisito, te podemos apartar al gato hasta una semana, siempre que sigamos en comunicación. Puede haber varias personas interesadas en el mismo gato.', 3),
  ('adoptar_seguimiento',    'Adoptar: seguimiento después',        'adoptar',         'Después de la adopción', 'Te vamos a contactar para saber cómo va: al principio cada semana, luego cada mes y después cada dos o tres meses.', 4),
  ('concientizacion_intro',  'Concientización: introducción',       'concientizacion', 'Esterilizar es la forma de cuidar', '', 1),
  ('concientizacion_encontre', 'Concientización: encontré un gato', 'concientizacion', 'Encontré un gato, ¿qué hago?', '', 2),
  ('apadrina_intro',         'Apadrina: introducción',              'apadrina',        'Apadrina a un michi', '', 1),
  ('ayudar_intro',           'Ayudar: introducción',                'ayudar',          'Otras formas de ayudar', '', 1),
  ('aviso_privacidad',       'Aviso de privacidad',                 'legal',           'Aviso de privacidad', '', 1);

