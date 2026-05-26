# Reglas De Loyalty Y Canjes

- los puntos pertenecen a una cuenta cliente autenticada
- una sola `loyalty_rule` activa gobierna la acumulacion
- los puntos no quedan `available` antes del hito elegible
- el canje `pending` reserva puntos de inmediato
- `applied` consume definitivamente la reserva
- `cancelled` libera la reserva y devuelve saldo
- los ajustes manuales son auditables y excepcionales
- la reversa por invalidez del pedido es automatica
- `/cuenta` muestra visibilidad, no autoservicio
