// 全局 CSS Module 声明，解决 TS2307: Cannot find module '*.module.css'
// 如果还需要支持 .scss/.less 可继续追加

declare module '*.module.css' {
    const classes: { [key: string]: string };
    export default classes;
}

declare module '*.module.scss' {
    const classes: { [key: string]: string };
    export default classes;
}

declare module '*.module.sass' {
    const classes: { [key: string]: string };
    export default classes;
}
