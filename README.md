# ts-run

[ts-node](https://npmjs.com/package/ts-node) but extremely fast ⚡️ 

Uses [esbuild](https://npmjs.com/package/esbuild) to compile TypeScript to JavaScript.

*Not ready for serious projects*

## Usage

```sh
ts-run <file-path>
```

Run directly with `npx`
```sh
npx ts-run src/index.ts
```

or install and run
```sh
npm install -g ts-run

ts-run src/index.ts
```

## When to use?

Use `tsc` for builds and `ts-run` for dev-mode.

*Not ready for serious projects!*

## Why esbuild?

- Esbuild does not do type-checking which makes the TypeScript to JavaScript compilation super fast!
- Type-checking is not a blocker for running scripts in dev-mode. IDEs can handle it as well as you can individually run `tsc` in emit mode.


Thanks! Have fun 🌻