import { fileURLToPath } from 'url'

export const getLocation = () => {
    const parseLine = (line: string) => {
        const match = line.match(
            /^\s*at\s+(?:(.+?)\s+\()?(.+?):(\d+):(\d+)\)?\s*$/
        )
        if (!match) return undefined
        return {
            functionName: match[1] ? match[1].trim() : null,
            file: match[2],
            line: Number(match[3]),
            column: Number(match[4])
        }
    }

    try {
        const error = new Error()
        Error.captureStackTrace(error, getLocation)

        const lines = error.stack ? error.stack.split('\n') : []
        const stringIndex = 2
        if (lines[stringIndex]) {
            const parsedLine = parseLine(lines[stringIndex])
            if (parsedLine) {
                return {
                    file: /^file:\/\//i.test(parsedLine.file)
                        ? fileURLToPath(parsedLine.file)
                        : parsedLine.file,
                    line: parsedLine.line,
                    column: parsedLine.column,
                    functionName: parsedLine.functionName
                }
            }
        }
    } catch {
        return undefined
    }

    return undefined
}
