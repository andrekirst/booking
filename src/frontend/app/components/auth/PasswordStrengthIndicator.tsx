'use client';

interface PasswordStrengthIndicatorProps {
    password: string;
}

type StrengthLevel = 'weak' | 'fair' | 'good' | 'strong';

interface StrengthInfo {
    level: StrengthLevel;
    score: number;
    label: string;
    color: string;
    bgColor: string;
}

export function PasswordStrengthIndicator({ password }: PasswordStrengthIndicatorProps) {
    const calculateStrength = (password: string): StrengthInfo => {
        if (!password) {
            return {
                level: 'weak',
                score: 0,
                label: 'Sehr schwach',
                color: 'text-red-600',
                bgColor: 'bg-red-500'
            };
        }

        let score = 0;
        const checks = {
            length: password.length >= 8,
            lowercase: /[a-z]/.test(password),
            uppercase: /[A-Z]/.test(password),
            numbers: /\d/.test(password),
            special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
            longEnough: password.length >= 12
        };

        // Base points for length
        if (checks.length) score += 2;
        if (checks.longEnough) score += 1;

        // Character variety
        if (checks.lowercase) score += 1;
        if (checks.uppercase) score += 1;
        if (checks.numbers) score += 1;
        if (checks.special) score += 2;

        // Determine strength level
        if (score <= 3) {
            return {
                level: 'weak',
                score,
                label: 'Schwach',
                color: 'text-red-600',
                bgColor: 'bg-red-500'
            };
        } else if (score <= 5) {
            return {
                level: 'fair',
                score,
                label: 'Ausreichend',
                color: 'text-yellow-600',
                bgColor: 'bg-yellow-500'
            };
        } else if (score <= 7) {
            return {
                level: 'good',
                score,
                label: 'Gut',
                color: 'text-blue-600',
                bgColor: 'bg-blue-500'
            };
        } else {
            return {
                level: 'strong',
                score,
                label: 'Sehr stark',
                color: 'text-green-600',
                bgColor: 'bg-green-500'
            };
        }
    };

    const getRequirements = (password: string) => {
        return [
            {
                text: 'Mindestens 8 Zeichen',
                met: password.length >= 8
            },
            {
                text: 'Klein- und Großbuchstaben',
                met: /[a-z]/.test(password) && /[A-Z]/.test(password)
            },
            {
                text: 'Mindestens eine Zahl',
                met: /\d/.test(password)
            },
            {
                text: 'Mindestens ein Sonderzeichen',
                met: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
            }
        ];
    };

    if (!password) {
        return null;
    }

    const strength = calculateStrength(password);
    const requirements = getRequirements(password);
    const strengthPercentage = Math.min((strength.score / 8) * 100, 100);

    return (
        <div className="space-y-3">
            <div className="flex items-center space-x-3">
                <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-gray-600">Passwort-Stärke</span>
                        <span className={`text-xs font-medium ${strength.color}`}>
                            {strength.label}
                        </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                            className={`h-2 rounded-full transition-all duration-300 ${strength.bgColor}`}
                            style={{ width: `${strengthPercentage}%` }}
                        ></div>
                    </div>
                </div>
            </div>

            <div className="space-y-1">
                <p className="text-xs text-gray-600 font-medium">Anforderungen:</p>
                <ul className="space-y-1">
                    {requirements.map((req, index) => (
                        <li key={index} className="flex items-center space-x-2 text-xs">
                            {req.met ? (
                                <svg className="w-3 h-3 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                                </svg>
                            ) : (
                                <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                                </svg>
                            )}
                            <span className={req.met ? 'text-green-700' : 'text-gray-600'}>
                                {req.text}
                            </span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}