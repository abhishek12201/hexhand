import {
  createSystem,
  Mesh,
  MeshBasicMaterial,
  SphereGeometry,
} from '@iwsdk/core';

const HAND_SIDES = ['left', 'right'] as const;
const JOINT_NAMES: readonly XRHandJoint[] = [
  'wrist',
  'thumb-metacarpal',
  'thumb-phalanx-proximal',
  'thumb-phalanx-distal',
  'thumb-tip',
  'index-finger-metacarpal',
  'index-finger-phalanx-proximal',
  'index-finger-phalanx-intermediate',
  'index-finger-phalanx-distal',
  'index-finger-tip',
  'middle-finger-metacarpal',
  'middle-finger-phalanx-proximal',
  'middle-finger-phalanx-intermediate',
  'middle-finger-phalanx-distal',
  'middle-finger-tip',
  'ring-finger-metacarpal',
  'ring-finger-phalanx-proximal',
  'ring-finger-phalanx-intermediate',
  'ring-finger-phalanx-distal',
  'ring-finger-tip',
  'pinky-finger-metacarpal',
  'pinky-finger-phalanx-proximal',
  'pinky-finger-phalanx-intermediate',
  'pinky-finger-phalanx-distal',
  'pinky-finger-tip',
];

type HandSide = (typeof HAND_SIDES)[number];
type JointDump = {
  position: [number, number, number];
  orientation: [number, number, number, number];
  radius: number | null;
};

export class HandJointSpikeSystem extends createSystem({}) {
  private readonly markers: Record<HandSide, Mesh[]> = {
    left: [],
    right: [],
  };
  private dumpRequested = false;

  init(): void {
    const geometry = new SphereGeometry(0.007, 8, 6);
    const materials: Record<HandSide, MeshBasicMaterial> = {
      left: new MeshBasicMaterial({ color: 0x37d4e5, toneMapped: false }),
      right: new MeshBasicMaterial({ color: 0xf3b84b, toneMapped: false }),
    };

    for (let sideIndex = 0; sideIndex < HAND_SIDES.length; sideIndex += 1) {
      const side = HAND_SIDES[sideIndex];
      for (let jointIndex = 0; jointIndex < JOINT_NAMES.length; jointIndex += 1) {
        const jointName = JOINT_NAMES[jointIndex];
        const marker = new Mesh(geometry, materials[side]);
        marker.name = `p1-${side}-${jointName}`;
        marker.visible = false;
        this.world.createTransformEntity(marker, { persistent: true });
        this.markers[side].push(marker);
      }
    }

    this.dumpRequested = new URLSearchParams(window.location.search).has(
      'dump-joints',
    );
  }

  update(): void {
    const frame = this.world.xrFrame;
    const referenceSpace = this.world.xrReferenceSpace;
    const session = this.world.xrSession;

    for (let sideIndex = 0; sideIndex < HAND_SIDES.length; sideIndex += 1) {
      const side = HAND_SIDES[sideIndex];
      const markers = this.markers[side];
      for (let jointIndex = 0; jointIndex < markers.length; jointIndex += 1) {
        markers[jointIndex].visible = false;
      }
    }

    if (
      frame == null ||
      referenceSpace == null ||
      session == null ||
      typeof frame.getJointPose !== 'function'
    ) {
      return;
    }

    const hands: Partial<Record<HandSide, Record<string, JointDump>>> | undefined =
      this.dumpRequested ? {} : undefined;
    let trackedJointCount = 0;

    for (
      let sourceIndex = 0;
      sourceIndex < session.inputSources.length;
      sourceIndex += 1
    ) {
      const inputSource = session.inputSources[sourceIndex];
      if (inputSource == null) {
        continue;
      }
      const hand = inputSource.hand;
      const side = inputSource.handedness;
      if (hand == null || (side !== 'left' && side !== 'right')) {
        continue;
      }

      for (let jointIndex = 0; jointIndex < JOINT_NAMES.length; jointIndex += 1) {
        const jointName = JOINT_NAMES[jointIndex];
        const jointSpace = hand.get(jointName);
        if (jointSpace == null) {
          continue;
        }

        const pose = frame.getJointPose(jointSpace, referenceSpace);
        if (pose == null) {
          continue;
        }

        const position = pose.transform.position;
        const orientation = pose.transform.orientation;
        const marker = this.markers[side][jointIndex];
        marker.position.set(position.x, position.y, position.z);
        marker.visible = true;
        trackedJointCount += 1;

        if (hands != null) {
          const handJoints = (hands[side] ??= {});
          handJoints[jointName] = {
            position: [position.x, position.y, position.z],
            orientation: [
              orientation.x,
              orientation.y,
              orientation.z,
              orientation.w,
            ],
            radius: pose.radius ?? null,
          };
        }
      }
    }

    if (hands != null && trackedJointCount > 0) {
      console.info(
        `[p1-joint-dump] ${JSON.stringify({
          predictedDisplayTime: frame.predictedDisplayTime,
          coordinateSpace: 'world.xrReferenceSpace',
          hands,
        })}`,
      );
      this.dumpRequested = false;
    }
  }
}