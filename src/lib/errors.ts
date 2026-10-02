export const GENERIC_ERROR = "Something went wrong. Please try again.";

type AuthLikeError = { code?: string; message?: string; status?: number };

/**
 * Maps technical auth/database errors to messages safe to show users.
 * Raw errors must only ever be logged, never displayed.
 */
export function toUserMessage(error: AuthLikeError | null | undefined): string {
  if (!error) return GENERIC_ERROR;
  const message = (error.message ?? "").toLowerCase();

  switch (error.code) {
    case "invalid_credentials":
      return "Incorrect email or password.";
    case "email_not_confirmed":
      return "Please confirm your email first. Check your inbox for the link.";
    case "weak_password":
      return "That password is too weak. Try a longer one.";
    case "over_request_rate_limit":
    case "over_email_send_rate_limit":
      return "Too many attempts. Please wait a few minutes and try again.";
    case "user_banned":
      return "This account is not available.";
    default:
  }

  if (error.status === 429) {
    return "Too many attempts. Please wait a few minutes and try again.";
  }
  // Raised by the signup trigger when the profile can't be created
  // (for example an invalid or under-age date of birth).
  if (message.includes("database error saving new user")) {
    return "We couldn't create your account. Please check your details and try again.";
  }
  return GENERIC_ERROR;
}
