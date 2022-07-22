import log4js from 'log4js';

log4js.configure({
  appenders: { defaultConsole: { type: 'console', layout: { type: 'pattern', pattern: '%p: [%c] %m' } } },
  categories: { default: { appenders: ['defaultConsole'], level: 'info' } },
});

export const getLogger = (category: string) => {
  return log4js.getLogger(category);
};
