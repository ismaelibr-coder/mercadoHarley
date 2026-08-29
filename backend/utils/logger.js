import util from 'util';
import pino from 'pino';

// A drop-in replacement for console.log/warn/error/debug that routes through pino
// (structured JSON in production, pretty-printed in development) without changing
// call sites' behavior. Pino's native multi-arg calls (logger.info('a', 'b', obj))
// silently drop everything after the first argument unless it's a printf-style
// format string — that's an easy way to lose logged data during a mechanical
// console.* -> logger.* migration. Formatting every call through util.format (the
// same engine console.log itself uses) keeps the exact same rendered message,
// just wrapped in pino's structured envelope (level, time, pid, hostname).
const base = pino({
    level: process.env.LOG_LEVEL || 'info',
    transport: process.env.NODE_ENV === 'production'
        ? undefined
        : { target: 'pino-pretty', options: { colorize: true, translateTime: 'HH:MM:ss', ignore: 'pid,hostname' } }
});

const wrap = (level) => (...args) => base[level](util.format(...args));

const logger = {
    info: wrap('info'),
    warn: wrap('warn'),
    error: wrap('error'),
    debug: wrap('debug')
};

export default logger;
