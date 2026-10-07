import { notify } from '@/lib/toast';

/** Acción de los módulos de diseño que aún no tienen backend. */
export const accionDemo = (accion: string) => () =>
  notify.info(`${accion}: disponible cuando este módulo se conecte al backend.`);
