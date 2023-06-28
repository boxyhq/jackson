import packageInfo from '../package.json';
import { initializeMetrics } from '@boxyhq/metrics';

initializeMetrics({ name: packageInfo.name, version: packageInfo.version });
