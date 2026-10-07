import { useQuery } from '@tanstack/react-query';
import { tiposDocumentoService } from '../services/tiposDocumentoService';

export function useTiposDocumento(enabled = true) {
  return useQuery({
    queryKey: ['tipos-documento'],
    queryFn: tiposDocumentoService.listar,
    staleTime: 10 * 60_000, // catálogo casi estático
    enabled,
  });
}
