/**
 * Valida body, query y params con esquemas de Zod.
 *
 * Reemplaza cada parte por su versión validada: los campos que no estén en el
 * esquema se descartan (lista blanca), así nunca llega a Mongoose algo inesperado.
 *
 *   router.post('/', validate({ body: createProductSchema }), controller.create);
 */
export const validate = (schemas) => (req, _res, next) => {
  try {
    if (schemas.params) req.params = schemas.params.parse(req.params);
    if (schemas.query) req.query = schemas.query.parse(req.query);
    if (schemas.body) req.body = schemas.body.parse(req.body);
    next();
  } catch (err) {
    next(err); // ZodError → 400 en el manejador central
  }
};
