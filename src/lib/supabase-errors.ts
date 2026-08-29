export interface SupabaseErrorInfo {
  message: string;
  code: string;
}

function extractCode(error: unknown): string {
  if (typeof error === "object" && error !== null && "code" in error) {
    return String((error as Record<string, unknown>).code);
  }
  return "";
}

function extractMessage(error: unknown): string {
  if (typeof error === "object" && error !== null && "message" in error) {
    return String((error as Record<string, unknown>).message);
  }
  if (typeof error === "string") return error;
  return "Error desconocido";
}

export function translateSupabaseError(error: unknown): SupabaseErrorInfo {
  const code = extractCode(error);
  const rawMessage = extractMessage(error);

  if (code === "42501" || rawMessage.includes("permission denied")) {
    return {
      message: "No tienes permisos para realizar esta acción.",
      code: "PERMISSION_DENIED",
    };
  }

  if (rawMessage.includes("row-level security policy")) {
    return {
      message: "Acceso restringido por políticas de seguridad.",
      code: "RLS_VIOLATION",
    };
  }

  if (code === "23505" || rawMessage.includes("duplicate key")) {
    return {
      message: "Ya existe un registro con estos datos. Verifica que no esté duplicado.",
      code: "UNIQUE_VIOLATION",
    };
  }

  if (code === "23514" || rawMessage.includes("check constraint") || rawMessage.includes("violates check")) {
    return {
      message: "Los datos no cumplen con las validaciones requeridas.",
      code: "CHECK_VIOLATION",
    };
  }

  if (code === "23503" || rawMessage.includes("foreign key")) {
    return {
      message: "Hay una referencia inválida a otro registro.",
      code: "FK_VIOLATION",
    };
  }

  if (code === "P0001") {
    return {
      message: rawMessage.replace(/^ERROR:\s*/i, ""),
      code: "TRIGGER_ERROR",
    };
  }

  if (
    rawMessage.toLowerCase().includes("network") ||
    rawMessage.toLowerCase().includes("fetch") ||
    rawMessage.toLowerCase().includes("failed to fetch")
  ) {
    return {
      message: "Error de conexión. Verifica tu red e inténtalo de nuevo.",
      code: "NETWORK_ERROR",
    };
  }

  return {
    message: "Ocurrió un error inesperado. Inténtalo de nuevo.",
    code: "UNKNOWN",
  };
}
