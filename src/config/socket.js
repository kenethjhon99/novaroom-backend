let ioInstance = null;

export const initSocket = (io) => {
  ioInstance = io;
};

export const getIO = () => {
  if (!ioInstance) {
    throw new Error("Socket.IO no inicializado");
  }

  return ioInstance;
};

export const emitToEmpresa = (id_empresa, event, payload = {}) => {
  if (!ioInstance || !id_empresa) return;

  ioInstance.to(`empresa:${id_empresa}`).emit(event, payload);
};

export const emitToSucursal = (id_sucursal, event, payload = {}) => {
  if (!ioInstance || !id_sucursal) return;

  ioInstance.to(`sucursal:${id_sucursal}`).emit(event, payload);
};