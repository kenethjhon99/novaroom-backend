export const errorMiddleware = (error, req, res, next) => {
  console.error("Error:", error);

  const statusCode = error.statusCode || 500;

  return res.status(statusCode).json({
    success: false,
    message: error.message || "Error interno del servidor",
    data: null,
    error: {
      code: error.code || "INTERNAL_ERROR",
      details: error.details || null,
    },
  });
};
