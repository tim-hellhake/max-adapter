/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.*
 */

import { Adapter, Device, Property } from 'gateway-addon';
import Cul from 'cul';

interface Packet {
  data: Data,
  address: string,
  device: string,
  rssi: number
}

interface Data {
  isopen: number
}

class ShutterContact extends Device {
  private open: Property;

  constructor(adapter: any, manifest: any, packet: Packet) {
    super(adapter, `${ShutterContact.name}-${packet.address}`);
    this['@context'] = 'https://iot.mozilla.org/schemas/';
    this.name = `${ShutterContact.name} (${packet.address})`;
    this.description = manifest.description;

    this.open = this.createProperty('open', {
      type: 'boolean',
      title: 'Open',
      description: 'If the window is open',
      readOnly: true
    });

    this.update(packet);
  }

  private createProperty(id: string, description: {}): Property {
    const property = new Property(this, id, description);
    this.properties.set(id, property);
    return property;
  }

  public update(packet: Packet) {
    if (packet && packet.data && packet.data) {
      this.open.setCachedValue(packet.data.isopen === 1);
      this.notifyPropertyChanged(this.open);
    }
  }
}

export class MaxAdapter extends Adapter {
  constructor(addonManager: any, manifest: any) {
    super(addonManager, MaxAdapter.name, manifest.name);
    addonManager.addAdapter(this);
    const knownDevices: { [key: string]: ShutterContact } = {};
    const {
      serialPort
    } = manifest.moziot.config;

    if (!serialPort) {
      console.warn('Serial port not configured')
    }

    const cul = new Cul({
      serialport: serialPort,
      baudrate: 38400,
      mode: 'MORITZ'
    });

    cul.on('ready', function () {
      console.log('Cul stick is ready');
    });

    cul.on('data', (_, parsed) => {
      const packet = <Packet>parsed;

      if (packet.device === 'ShutterContact') {
        const knownDevice = knownDevices[packet.address];

        if (knownDevice) {
          knownDevice.update(packet);
        } else {
          console.log(`New shutter contact ${packet.address} detected`);
          const shutterContact = new ShutterContact(this, manifest, packet);
          knownDevices[packet.address] = shutterContact;
          this.handleDeviceAdded(shutterContact);
          shutterContact.update(packet);
        }
      }
    });
  }
}
