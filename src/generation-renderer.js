import { secondsToTime } from "./utils.js";
import { describeCameraPlan } from "./camera.js";

function assets(referencePrompts = {}) {
  return [...(referencePrompts.existingReferences || []), ...(referencePrompts.assets || [])]
    .sort((a, b) => Number(String(a.pictureId).match(/\d+/)?.[0]) - Number(String(b.pictureId).match(/\d+/)?.[0]));
}

function identity(asset) {
  return asset.name || asset.description || asset.purpose || asset.pictureId;
}

function assetMetadata(asset) {
  const links = [
    asset.linkedSubjects?.length ? `linkedSubjects ${asset.linkedSubjects.map((item) => `<${item}>`).join(", ")}` : "",
    asset.locationKey ? `locationKey ${asset.locationKey}` : "",
    asset.objectKey ? `objectKey ${asset.objectKey}` : "",
    asset.purpose ? `purpose ${asset.purpose}` : ""
  ].filter(Boolean).join(", ");
  return `${asset.assetType || "reference"} asset ${identity(asset)}${links ? `, ${links}` : ""}`;
}

function referencesForShot(referencePrompts, shotNumber) {
  return assets(referencePrompts).filter((asset) => (asset.usedInShots || []).map(Number).includes(Number(shotNumber)));
}

function textOnlyForShot(referencePrompts, shotNumber) {
  return (referencePrompts?.textOnlyRequirements || [])
    .filter((item) => (item.usedInShots || []).map(Number).includes(Number(shotNumber)))
    .map((item) => `${item.assetType} ${item.key}: ${item.description}`);
}

function sourceBlock(text, label, number, nextNumber) {
  const start = text.indexOf(`[${label} ${number}]`);
  if (start < 0) return "";
  const next = text.indexOf(`[${label} ${nextNumber}]`, start + 1);
  const raw = text.slice(start, next < 0 ? undefined : next);
  return raw
    .replace(new RegExp(`^\\[${label} ${number}\\](?:\\s+At\\s+\\d{2}:\\d{2}\\.\\d{3}|\\s+\\d{2}:\\d{2}\\.\\d{3}-\\d{2}:\\d{2}\\.\\d{3})?\\s*`, "i"), "")
    .split(/\n(?:overall_soundscape|non_diegetic_music|GLOBAL_CONSTRAINTS|REFERENCE_MAPPING|SEQUENCE_SPECIFICATION|TIMECODED_BEATS):/i, 1)[0]
    .trim();
}

function canonicalShotDetails(shot, referencePrompts, visualDirection, pictureToken) {
  const camera = describeCameraPlan(shot.camera, shot.cameraContinuity);
  const subjects = (shot.subjects || []).map((item) => `<${item}>`).join(", ") || "No visible subject";
  const offscreen = (shot.offscreenSubjects || []).map((item) => `<${item}>`).join(", ") || "none";
  const refs = referencesForShot(referencePrompts, shot.number).map(pictureToken).join(", ") || "none";
  const textOnly = textOnlyForShot(referencePrompts, shot.number).join("; ") || "none";
  const beats = (shot.actionBeats || []).map((beat) => `${beat.startOffset}-${beat.endOffset}s: ${beat.action}; result: ${beat.result}`).join(" Then ") || shot.action;
  const dialogue = (shot.dialogue || []).map((item) => `<${item.speaker}> (${item.delivery || "unspecified"}; lip sync ${typeof item.lipSync === "boolean" ? (item.lipSync ? "on" : "off") : "unspecified"}; ${item.performance}) <d>[${item.language || "English"}] ${item.line}</d>`).join(" ") || "No dialogue.";
  return `Visual direction: ${visualDirection?.label || "approved style"}; Mood: ${visualDirection?.mood || "approved mood"}. Camera starts at ${camera.position}, ${camera.shotSize}, ${camera.angle}, ${camera.perspective} perspective, ${camera.height} height, ${camera.lensMm}, composed as ${shot.composition}, focused on ${camera.focusDescription}. Screen direction: ${camera.screenDirection} (${camera.screenDirectionCode}) for ${camera.screenDirectionSubject}. Camera intent: ${camera.intent}. Camera continuity: axis ${camera.continuity.axis} [${camera.continuity.axisId}, side ${camera.continuity.cameraSide}, ${camera.continuity.axisTransition}]; eyeline ${camera.continuity.eyeline} [${camera.continuity.eyelineMatchId}, ${camera.continuity.eyelineDirection}, ${camera.continuity.eyelineTransition}]; entry ${camera.continuity.entryDirection}; exit ${camera.continuity.exitDirection}; continuity motivation ${camera.continuity.changeMotivation}; bridge from previous shot ${camera.continuity.previousShotBridge}. Visible subjects: ${subjects}; offscreen subjects: ${offscreen}; reference images: ${refs}. Text-only visual definitions (describe directly without requesting another reference image): ${textOnly}. Spatial anchor: ${shot.spatialAnchor}. Start state: ${shot.startState}. Causal link: ${shot.causalLink}. Action sequence: ${beats}. Primary camera movement: ${camera.movement}. Lighting: ${shot.lighting}. Performance changes from ${shot.emotion?.start} to ${shot.emotion?.end}, shown by ${shot.emotion?.visibleCue}. Dialogue: ${dialogue} Sound: ambience ${shot.sound?.ambience}; synchronized effects ${(shot.sound?.syncEffects || []).join(", ") || "none"}; voice ${shot.sound?.voice}; music ${shot.sound?.music}; bridge ${shot.sound?.bridge}. End state: ${shot.endState}. Continuity in: ${(shot.continuityIn || []).join(", ")}. Continuity out: ${(shot.continuityOut || []).join(", ")}. Transition: ${shot.transition?.type}, motivated by ${shot.transition?.motivation}. Constraints: ${(shot.negativeConstraints || []).join(", ") || "preserve approved continuity"}.`;
}

function renderMinimax({ creativeText, story, shots, prefix, visualDirection, referencePrompts }) {
  const referenceAssets = assets(referencePrompts);
  const mappings = referenceAssets.map((asset) => `<${asset.pictureId}> maps to ${assetMetadata(asset)}.`);
  const characters = (story.characters || []).map((character) => `<${character.id}> is ${character.name}, ${character.role}: ${character.description}. Continuity: ${(character.continuityRules || []).join(", ")}.`);
  const retention = referenceAssets.map((asset) => `<${asset.pictureId}> appears in shots ${(asset.usedInShots || []).join(", ") || "none"} and preserves ${asset.purpose || identity(asset)}.`);
  const blocks = (shots.shots || []).map((shot, index) => {
    const heading = `[Shot ${shot.number}]${index ? ` At ${secondsToTime(shot.startTime)}` : ""}`;
    const creative = sourceBlock(creativeText, "Shot", shot.number, shot.number + 1);
    return `${heading} ${canonicalShotDetails(shot, referencePrompts, visualDirection, (asset) => `<${asset.pictureId}>`)}${creative ? ` Creative staging: ${creative}` : ""}`;
  });
  return `${prefix}subject_definitions:\n${[...mappings, ...characters].join("\n")}\nsummary:\n${story.logline || story.title}. Visual direction: ${visualDirection?.label}; Mood: ${visualDirection?.mood}.\nretention_analysis:\n${retention.join("\n")}\ndetailed_description:\n${blocks.join("\n")}\noverall_soundscape:\n${story.soundDirection || "Use the approved synchronized ambience and effects from each shot."}\nnon_diegetic_music:\n${(shots.shots || []).some((shot) => shot.sound?.music && shot.sound.music !== "none") ? "Use only the music specified in the approved shots." : "None."}`;
}

function renderSeedance({ creativeText, story, shots, visualDirection, referencePrompts }) {
  const referenceAssets = assets(referencePrompts);
  const mappings = referenceAssets.map((asset) => {
    const number = String(asset.pictureId).match(/\d+/)?.[0];
    return `@Image${number} = <${asset.pictureId}>; ${assetMetadata(asset)}.`;
  });
  const blocks = (shots.shots || []).map((shot) => {
    const creative = sourceBlock(creativeText, "Beat", shot.number, shot.number + 1);
    return `[Beat ${shot.number}] ${secondsToTime(shot.startTime)}-${secondsToTime(shot.endTime)} ${canonicalShotDetails(shot, referencePrompts, visualDirection, (asset) => `@Image${String(asset.pictureId).match(/\d+/)?.[0]}`)}${creative ? ` Creative staging: ${creative}` : ""}`;
  });
  const constraints = [...new Set((shots.shots || []).flatMap((shot) => shot.negativeConstraints || []))];
  return `REFERENCE_MAPPING:\n${mappings.join("\n")}\nSEQUENCE_SPECIFICATION:\nGenerator target: Seedance 2.5\nDuration: ${story.durationSeconds}s\nVisual direction: ${visualDirection?.label}\nMood: ${visualDirection?.mood}\nLanguage: ${story.dialogueLanguage || "English"}\nSound direction: ${story.soundDirection || "approved shot sound"}\nTIMECODED_BEATS:\n${blocks.join("\n")}\nGLOBAL_CONSTRAINTS:\nPreserve character identity, anatomy, wardrobe, prop ownership and state, location geography, screen direction, lighting, physics, synchronized audio, dialogue and lip sync. No subtitles, logos, watermarks, UI, extra characters or unapproved props. ${constraints.join("; ")}`;
}

export function renderGenerationPrompt({ creativeText = "", story, shots, prefix = "DY,", visualDirection, referencePrompts, generationTarget }) {
  const input = { creativeText, story, shots, prefix, visualDirection, referencePrompts };
  return generationTarget === "seedance-2.5" ? renderSeedance(input) : renderMinimax(input);
}
