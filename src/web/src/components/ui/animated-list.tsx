'use client'

import { cn } from '@/lib/utils'
import { AnimatePresence, motion } from 'framer-motion'
import { ReactElement, useEffect, useMemo, useState } from 'react'

interface AnimatedListProps {
    className?: string
    children: ReactElement[]
    delay?: number
}

export const AnimatedList = ({ className, children, delay = 1000 }: AnimatedListProps) => {
    const [index, setIndex] = useState(0)
    const childrenArray = useMemo(() => children, [children])

    useEffect(() => {
        const interval = setInterval(() => {
            setIndex((prevIndex) => (prevIndex + 1) % childrenArray.length)
        }, delay)

        return () => clearInterval(interval)
    }, [childrenArray.length, delay])

    const itemsToShow = useMemo(() => {
        const result = childrenArray.slice(0, index + 1).reverse()
        return result
    }, [index, childrenArray])

    return (
        <div className={cn('flex flex-col items-center gap-2', className)}>
            <AnimatePresence>
                {itemsToShow.map((item) => (
                    <AnimatedListItem key={(item.key as string) || Math.random().toString()}>
                        {item}
                    </AnimatedListItem>
                ))}
            </AnimatePresence>
        </div>
    )
}

const AnimatedListItem = ({ children }: { children: ReactElement }) => {
    const animations = {
        initial: { scale: 0, opacity: 0 },
        animate: { scale: 1, opacity: 1, originY: 0 },
        exit: { scale: 0, opacity: 0 },
        transition: { type: 'spring', stiffness: 350, damping: 40 },
    }

    return (
        <motion.div {...animations} layout className="mx-auto w-full">
            {children}
        </motion.div>
    )
}

