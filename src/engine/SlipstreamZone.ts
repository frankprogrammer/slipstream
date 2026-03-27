import { CONFIG } from '../config';

/**
 * SlipstreamZone — Detects when the player is drafting behind a vehicle.
 *
 * Each traffic vehicle has an invisible rectangular zone behind it:
 * - Width: CONFIG.SLIPSTREAM_ZONE_WIDTH (centered on vehicle)
 * - Depth: CONFIG.SLIPSTREAM_ZONE_DEPTH (extending below vehicle)
 *
 * When the player overlaps this zone:
 * 1. Emit 'draft-start' event (first frame of overlap)
 * 2. Fill draft meter at CONFIG.DRAFT_FILL_RATE per frame
 * 3. When meter fills OR player exits zone → emit 'draft-complete'
 *
 * When player exits without filling meter → emit 'draft-cancel'
 *
 * Visual feedback (handled by GameScene listening to events):
 * - Speed lines particle emitter
 * - Amber glow on target vehicle
 * - Draft meter UI element
 * - Audio: tunneled wind + rising tone
 */
export class SlipstreamZone {
  // TODO: Implement
}
