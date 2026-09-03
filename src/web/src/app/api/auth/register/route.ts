import { getBridgeUrl } from '@/lib/utils'
import { getHostnameFromHeaderValue } from '@/lib/request-host'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const registerSchema = z.object({
    name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(6),
})

function basicRegistrationEnabled(): boolean {
    const value = process.env.BASIC_REGISTRATION_ENABLED?.trim().toLowerCase()
    return value === 'true' || value === '1'
}

export async function POST(request: NextRequest) {
    if (!basicRegistrationEnabled()) {
        return NextResponse.json(
            { error: 'Email registration is disabled. Use GitHub to create an account.' },
            { status: 403 },
        )
    }

    try {
        const body = await request.json()
        const { name, email, password } = registerSchema.parse(body)

        const payload = {
            email,
            password,
            name,
            image: `https://api.dicebear.com/8.x/pixel-art/svg?seed=${email}`,
        }

        const hostname = getHostnameFromHeaderValue(
            request.headers.get("x-forwarded-host") ?? request.headers.get("host"),
        );

        const response = await fetch(`${getBridgeUrl({ hostname })}/v1/basic_register`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        })

        const data = await response.json()

        if (!response.ok) {
            const errorMap: Record<string, string> = {
                'USER_EXISTS': 'User already exists',
                'INVALID_BODY': 'Invalid request data',
                'INVALID_JSON': 'Invalid request format',
                'DATABASE_ERROR': 'Database error occurred',
                'SALT_GENERATION_ERROR': 'Registration failed',
                'TOKEN_ERROR': 'Authentication failed',
                'BASIC_REGISTRATION_DISABLED': 'Email registration is disabled. Use GitHub to create an account.',
            }

            const errorMessage = errorMap[data.code] || 'Registration failed'
            return NextResponse.json({ error: errorMessage }, { status: response.status })
        }

        return NextResponse.json({
            message: 'Account created successfully',
            token: data.token,
            id: data.id
        })

    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: 'Invalid input data' }, { status: 400 })
        }

        console.error('Registration error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
