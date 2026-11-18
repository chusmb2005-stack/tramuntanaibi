# Carta editable desde Google Sheets

## Cómo está montado
- La hoja «Carta y horario Café Tramuntana» (dos pestañas: Carta y Horario) está en el Drive de Chus:
  https://docs.google.com/spreadsheets/d/1j95VYi6wmIEYJ1HAUu96MOBv_wDKIOze5eoJGfa4j44/edit
- Está compartida como «cualquiera con el enlace puede ver» (la web la necesita así para leerla).
  Solo edita quien tenga permiso de editor.
- Su enlace está ya en `carta-datos.js` (`SHEET_CSV_URL`).
- **Falta**: compartir la hoja como editor con el dueño (Compartir > su correo).

## Uso diario (para el dueño)
### Pestaña «Carta»
Cada fila es un producto. Columnas:

| Columna | Qué poner |
|---|---|
| Categoria | Cafés & Desayunos, Tapas & Picoteo… (una nueva = una tarjeta nueva) |
| Apartado | Subgrupo dentro de la categoría (Cafés, Desayunos…) |
| Producto | Nombre |
| Precio | `2,50` (el € se añade solo) |
| Descripcion | Opcional |
| Estrella | `SI` para destacarlo |
| Disponible | `NO` para ocultarlo sin borrarlo (agotado) |

- **Cambiar precio**: editar la celda. **Añadir**: nueva fila con una categoría/apartado existente.
- El orden de la carta es el de la hoja.
- Los cambios tardan unos minutos en verse (Google refresca la publicación).
- No cambiar los títulos de la fila 1.
- Una categoría nueva sale sin foto ni subtítulo hasta que se añada `img/cat-<nombre>.jpg`.

## Si falla
Si la hoja no responde, la web enseña la última carta que cargó ese móvil o, si no hay, la de ejemplo de `carta.html`.


## Pestaña «Horario»
Una fila por día (Lunes a Domingo) y dos turnos:

| Dia | Turno 1 | Turno 2 |
|---|---|---|
| Lunes | 08:30-14:00 | 16:30-22:00 |
| Domingo | Cerrado | |

- Formato del turno: `08:30-14:00`. Las `00:00` del cierre son medianoche.
- Sin turno de tarde: dejar Turno 2 vacío. Día cerrado: escribir `Cerrado` en Turno 1.
- No cambiar los nombres de los días ni la fila 1.
- **Avisos**: en la fila «Aviso», escribir el mensaje en Turno 1 (p. ej. «Cerrado el 24 de diciembre»). Sale en un recuadro amarillo junto al «Abierto ahora» de la portada y encima del horario. Para quitarlo, borrar el texto. Se pueden añadir más filas «Aviso».
- El horario cambia el listado, el «Abierto ahora» y los avisos. Si la hoja falla o está incompleta (faltan días), la web usa el horario habitual guardado en `index.html`.
- Limitación: el horario que ve Google en su ficha (datos estructurados de `index.html`) es fijo; si el horario cambia de forma permanente hay que actualizarlo también ahí.
