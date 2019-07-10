/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

interface Config {
    serialport: string,
    baudrate: number,
    mode: string
}

declare module 'cul' {
    export default class Cul {
        constructor(config: Config);
        public on(type: 'ready', listener: () => void): void;
        public on(type: 'data', listener: (raw: string, parsed: {}) => void): void;
    }
}
