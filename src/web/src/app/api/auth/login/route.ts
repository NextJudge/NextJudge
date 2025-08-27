import { getBridgeUrl } from '@/lib/utils'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
})

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { email, password } = loginSchema.parse(body)

        const response = await fetch(`${getBridgeUrl()}/v1/basic_login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ email, password }),
        })

        const data = await response.json()

        if (!response.ok) {
            const errorMap: Record<string, string> = {
                'INVALID_CREDENTIALS': 'Invalid email or password',
                'INVALID_BODY': 'Invalid request data',
                'INVALID_JSON': 'Invalid request format',
                'TOKEN_ERROR': 'Authentication failed',
            }

            const errorMessage = errorMap[data.code] || 'Login failed'
            return NextResponse.json({ error: errorMessage }, { status: response.status })
        }

        return NextResponse.json({
            message: 'Login successful',
            token: data.token,
            id: data.id
        })

    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: 'Invalid input data' }, { status: 400 })
        }

        console.error('Login error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
