namespace Booking.Api.Features.EmailSettings;

public record EmailSettingsDto
{
    public string SmtpHost { get; init; } = string.Empty;
    public int SmtpPort { get; init; }
    public string SmtpUsername { get; init; } = string.Empty;
    public string SmtpPassword { get; init; } = string.Empty;
    public string FromName { get; init; } = string.Empty;
    public string FromEmail { get; init; } = string.Empty;
    public bool UseTls { get; init; }
    public bool IsConfigured { get; init; }
}

public record UpdateEmailSettingsRequest
{
    public string SmtpHost { get; init; } = string.Empty;
    public int SmtpPort { get; init; }
    public string SmtpUsername { get; init; } = string.Empty;
    public string SmtpPassword { get; init; } = string.Empty;
    public string FromName { get; init; } = string.Empty;
    public string FromEmail { get; init; } = string.Empty;
    public bool UseTls { get; init; }
}

public record EmailSettingsResponse
{
    public string Message { get; init; } = string.Empty;
    public EmailSettingsDto Settings { get; init; } = null!;
}

public record TestEmailRequest
{
    public string ToEmail { get; init; } = string.Empty;
    public string? Subject { get; init; }
    public string? Body { get; init; }
}

public record TestEmailResponse
{
    public string Message { get; init; } = string.Empty;
    public bool Success { get; init; }
}