import { relative } from "path";
import chalk from "chalk";

export const determineScript = () => relative(process.cwd(), process.argv[1]);

// NOTE: just caching the result since it shouldn't change while the script is running
export const SCRIPT = determineScript();

export type LogFunction = typeof console.log;

export const log: LogFunction = (...args: Parameters<LogFunction>) => {
  chalk.reset();
  const now = new Date().toISOString();
  console.log(chalk`{dim [${SCRIPT}][${now}]}`, ...args);
};

export type DisplayHelpOptions = {
  dir: string;
  ext: string;
};

export const displayHelp: ({ dir, ext }: DisplayHelpOptions) => void = ({
  dir,
  ext,
}) => {
  chalk.reset();
  log(chalk`

Usage: {white ${SCRIPT}} {dim ${dir}}{white name}{dim ${ext}}

{yellowBright Note:} provide only the name, the directory and extension will be added automatically

`);
};

export type WithErrorReporterOptions = {
  verbose?: boolean;
  critical?: boolean;
  stack?: boolean;
};

export const withErrorReporter = <T extends Function>(
  options: WithErrorReporterOptions | undefined,
  asyncFunction: T
): T => {
  const { critical = false, stack = true, verbose = true } = options ?? {};

  if (!verbose) {
    return asyncFunction;
  }

  const functionName = asyncFunction.name ?? "anonymousAsyncFunction";
  const wrapperName = `withErrorReporter(${functionName})`;

  // NOTE: this is a way for JS to set the name of the wrapper function
  const temporaryObject = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [wrapperName]: (...args: any[][]) => {
      const promise = asyncFunction(...args);
      const handled = promise.catch((e: Error) => {
        chalk.reset();

        log(
          chalk`{dim withErrorReporter(}{white ${functionName}}{dim )}{white :} {red.inverse ERROR} {red ${e.message}}`
        );

        if (stack) {
          log(chalk`{dim ${e.stack}}`);
        }
      });

      // NOTE: the handled one will not re-throw the error
      return critical ? promise : handled;
    },
  };

  return (temporaryObject[wrapperName] as unknown) as T;
};

export const displayProps: (stats: Record<string, unknown>) => void = (
  stats
) => {
  for (const [key, val] of Object.entries(stats ?? {})) {
    if (val === null || val === undefined) {
      log(chalk`{magenta ${key}}: {redBright ${val}}`);
    } else if (val === true || val === false) {
      log(chalk`{magenta ${key}}: {blueBright ${val}}`);
    } else if (typeof val === "string") {
      log(chalk`{magenta ${key}}: {green ${val}}`);
    } else if (typeof val === "number") {
      log(chalk`{magenta ${key}}: {yellow ${val}}`);
    } else {
      log(chalk`{magenta ${key}}: {dim ${val}}`);
    }
  }
};
