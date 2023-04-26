var _sounds = {
  ping: new Howl({ src: "sounds/ping.mp3" })
};

function sfx(name) {
  let sound = _sounds[name];
  if (sound.constructor === Array) sound = sound[sound.length * Math.random() | 0];
  sound.play();
}
