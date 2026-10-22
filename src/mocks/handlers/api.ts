import { type DefaultBodyType, http, type HttpResponseResolver, type PathParams } from 'msw'
import { type RequestKind, simulateNetwork } from '../scenarios/network'

type Method = 'get' | 'post' | 'put' | 'patch' | 'delete'

export function apiRoute<Params extends PathParams = PathParams>(
  method: Method,
  path: string,
  resolver: HttpResponseResolver<Params, DefaultBodyType>,
  options: { kind?: RequestKind } = {},
) {
  return http[method]<Params, DefaultBodyType>(`/api${path}`, async (info) => {
    const blocked = await simulateNetwork(options.kind ?? 'api')
    if (blocked) return blocked
    return resolver(info)
  })
}
