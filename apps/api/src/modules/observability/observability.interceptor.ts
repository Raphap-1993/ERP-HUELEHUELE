import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { Observable, throwError } from "rxjs";
import { catchError, finalize } from "rxjs/operators";
import type { AuthSessionSummary } from "@huelegood/shared";
import { ObservabilityService } from "./observability.service";

interface AuthenticatedRequest {
  method: string;
  originalUrl?: string;
  url?: string;
  authSession?: AuthSessionSummary;
  authUser?: AuthSessionSummary["user"];
}

interface ResponseLike {
  statusCode: number;
  getHeader(name: string): number | string | string[] | undefined;
}

@Injectable()
export class ObservabilityInterceptor implements NestInterceptor {
  constructor(private readonly observabilityService: ObservabilityService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== "http") {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const response = context.switchToHttp().getResponse<ResponseLike>();
    const startedAt = performance.now();
    let errorName: string | undefined;
    let errorMessage: string | undefined;

    return next.handle().pipe(
      catchError((error: unknown) => {
        if (error instanceof Error) {
          errorName = error.name;
          errorMessage = error.message;
        } else {
          errorName = "UnknownError";
        }

        return throwError(() => error);
      }),
      finalize(() => {
        const requestIdHeader = response.getHeader("X-Request-Id");
        const requestId =
          (Array.isArray(requestIdHeader) ? requestIdHeader[0] : requestIdHeader)?.toString() ?? "missing-request-id";

        this.observabilityService.recordHttpRequest({
          requestId,
          method: request.method,
          path: request.originalUrl?.split("?")[0] ?? request.url?.split("?")[0] ?? "/",
          statusCode: response.statusCode ?? 200,
          durationMs: Math.round((performance.now() - startedAt) * 10) / 10,
          occurredAt: new Date().toISOString(),
          actorUserId: request.authUser?.id,
          actorName: request.authUser?.name,
          errorName,
          errorMessage
        });
      })
    );
  }
}
