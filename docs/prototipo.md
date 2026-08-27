# Nota técnica — `index.html`

Detalle de qué es exactamente el archivo del prototipo, para quien lo tenga que abrir,
modificar o re-exportar. Para el contenido del diseño ve el [README](../README.md).

> [!WARNING]
> Igual que el resto del repo: esto es un **prototipo de diseño**, no código de producción.
> No se reutiliza como base del sitio final — el sitio se construye aparte cuando se defina el stack.

---

## Qué es el archivo

| | |
|---|---|
| **Formato** | Export de un lienzo de Claude Design (`design_doc_mode: canvas`) |
| **Tamaño** | ~3.0 MB (3,099,459 bytes), un solo archivo |
| **Runtime** | React 18.3.1 (UMD) empaquetado dentro del mismo archivo |
| **Lienzo** | 1440 px, solo escritorio · 8 secciones apiladas |

El `<title>` dice `Bundled Page` porque lo pone el empaquetador; no es un descuido que valga la pena
arreglar a mano, se pierde en el siguiente export.

## Qué va embebido y qué no

El archivo **no es 100 % autocontenido**:

- ✅ **Fuentes embebidas.** Bricolage Grotesque y Figtree van como `woff2` dentro del archivo.
  No se piden a `fonts.gstatic.com` aunque el `<head>` traiga los `preconnect`.
- ❌ **Fotos de gatos remotas.** Son **18 peticiones a `images.unsplash.com`** en tiempo de carga
  (`background-image` de CSS, no `<img>` — así funcionan las máscaras blob). No hay ni un `data:` URI
  en el archivo.

**Consecuencia práctica:** sin internet el prototipo carga y navega bien, pero las fichas de gato salen
sin foto. Si lo vas a enseñar en la reunión, ábrelo antes con red para que quede en caché del navegador.

Cuando lleguen las fotos reales del café esto se resuelve solo: dejan de ser hotlinks a Unsplash.

## Cómo servirlo

```bash
python3 -m http.server 8899
```

Y abre <http://localhost:8899/index.html>. Tiene que ser por HTTP; `file://` no es un escenario probado.

## Los tweaks (props del lienzo)

El documento define tres props. En el **lienzo** aparecen como controles; en el **archivo exportado
no hay panel** — se quedan fijos en su valor por defecto.

| Prop | Editor | Valores | Default | Para qué |
|---|---|---|---|---|
| `gatosEnAdopcion` | range | `0`–`7` | `7` | Cuántos gatos adoptables se pintan. Con `0` el módulo celebra en vez de verse roto. |
| `estadoCafe` | enum | `auto` · `abierto` · `cerrado` | `auto` | Fuerza el chip "Abierto ahora". En `auto` se calcula del horario semanal. |
| `mostrarNotas` | boolean | `true` / `false` | `true` | Muestra u oculta las columnas ámbar de notas y supuestos. |

### Cambiarlos sin el lienzo

Busca `data-props` en `index.html` y edita el `default` de la prop. El JSON viene con las comillas
escapadas como `&quot;`, así que la cadena a buscar se ve así:

```
&quot;gatosEnAdopcion&quot;: {&quot;editor&quot;: &quot;range&quot;, &quot;default&quot;: 7, ...
```

Cambia el `7` y recarga. Probado: con `default: 0` el índice pasa de 18 a 7 fotos y aparece el estado
vacío del módulo.

Es un parche para revisar estados rápido, no una forma de trabajar. Los cambios de diseño de verdad se
hacen en el lienzo y se vuelve a exportar el archivo completo.

> `gatosEnAdopcion` llega a 7 y no más porque solo hay 7 gatos adoptables en los datos placeholder.
> El límite es del set de datos, no del layout.

## Los datos placeholder

10 gatos inventados en un solo arreglo (`CATS`), repartidos en los tres estados que el diseño nunca aplana:

| Estado | Cuántos | Quiénes |
|---|---|---|
| En adopción | 7 | Frijolita · Tamal · Nube · Canela · Chicharrón · Ajonjolí · Luna |
| Residente de casa | 2 | Ramsés · Cleo |
| En tratamiento | 1 | Motita |

Los filtros del índice (estado, edad, sexo, convivencia) corren de verdad sobre ese arreglo.
Nombres, edades, historias y fotos son invento — ver el [aviso del README](../README.md#aviso).
