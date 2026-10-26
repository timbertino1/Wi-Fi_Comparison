// Shared scene parts exposed to scenes as ctx.kit (contracts/scene-module.md).
import { accessPoint } from './access-point.js';
import { client, clientCrowd, clientTypes } from './client.js';
import { frequencyScale, band, channelBlock, frequencyAxis } from './spectrum.js';
import { packet, linkBeam, constellation } from './signals.js';
import { timeline } from './timeline.js';

export const kit = { accessPoint, client, clientCrowd, clientTypes, frequencyScale, band, channelBlock, frequencyAxis, packet, linkBeam, constellation, timeline };
