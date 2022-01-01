let inited = false;
let currentDeviceId;
const frameId = Date.now();
function init (deviceId) {
	currentDeviceId = deviceId;
	if (!inited) {
		inited = true;
		inject(AuRoPatchContent);
	}
	inject(AuRoSetOutputDevice(deviceId))
	chrome.runtime.sendMessage({
		name: 'updatePopupIconText',
		deviceId,
	});
}

chrome.runtime.sendMessage({
	name: 'content:init',
	frameId,
});

function filterOutputDevices (devices) {
  return devices.filter(({ kind }) => kind === 'audiooutput')
}

function log (desc, ...args) {
  if (!args.length && typeof desc === 'string')
    return (...args) => log(desc, ...args);
  console.log('AuRo :: ', desc, ...args);
  return args[0];
}

function listenStorage (tabId) {
	chrome.storage.onChanged.addListener(function (changes, namespace) {
	  for (let [key, { oldValue, newValue }] of Object.entries(changes)) {
	    if (key === `tab_${ tabId }`) {
	    	init(newValue);
	    }
	  }
	});
}

chrome.runtime.onMessage.addListener(
	(msg, sender, send) => {
		log('onMessage', { msg, sender });
		
		switch (msg.name) {
			case 'content:init:resp':
				if (msg.frameId !== frameId)
					return;
				if (msg.deviceId && msg.deviceId !== 'default') {
					init(msg.deviceId);
				}
				listenStorage(msg.tabId);
				break;

			case 'popup:getState':
				navigator.mediaDevices.getUserMedia({ audio: true }).then(() => {
					return navigator.mediaDevices.enumerateDevices().then(devices => {
						chrome.runtime.sendMessage({
							id: msg.id,
							name: 'popup:getState:resp',
							devices: filterOutputDevices(devices),
							currentDeviceId,
							frameId,
						});
					});
				}).catch(err => {});
				break;

			default:
				console.error('AuRo :: Unknown msg!!!');
				log('Unknown msg!')(msg);
		}
	}
);

function AuRoSetOutputDevice (deviceId) {
	return `() => { $AuRo.update('${ deviceId }') }`;
}

const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

chrome.runtime.sendMessage({
	name: 'updatePopupIconTheme',
	isDark,
});

function AuRoPatchContent () {
	window.$AuRo = {
		els: [],
		addEl (el) {
			let i = this.els.indexOf(el);
			if (~i)
				this.els.splice(i, 1);
			this.els.unshift(el);
		},

		deviceId: null,
		update (deviceId) {
			$AuRo.deviceId = deviceId;
			l('update', { deviceId });
			if (this.els[0]) {
				this.els[0].pause();
				this.els[0].setSinkId(deviceId);
				setTimeout(() => this.els[0].play(), 3);
			}
		}
	};

	const getDeviceId = () => navigator.mediaDevices.getUserMedia({ audio: true }).then(() => {
		return navigator.mediaDevices.enumerateDevices().then(devices => {
			l({devices})
			const selectedDevice = devices.find(({ deviceId }) => deviceId === $AuRo.deviceId);
			if (selectedDevice)
				return selectedDevice.deviceId;
			return Promise.reject('deviceId ' + $AuRo.deviceId + ' not found');
		});
	});

	var frameDepth = (function getDepth(w) {
		return w.parent === w ? 0 : 1 + getDepth(w.parent);
	})(window);

	var _audioPlay = HTMLAudioElement.prototype.play;
	HTMLAudioElement.prototype.play = function () {
		l('Audio.play()', this);
		$AuRo.addEl(this);
		getDeviceId().then(deviceId => {
			this.setSinkId($AuRo.deviceId).then(arg => {
				l('Audio.play().getDeviceId().setSinkId()', { deviceId });
				_audioPlay.call(this); 
			});
		}).catch(err => {
			_audioPlay.call(this);
			le(err);
		});
	};

	var _videoPlay = HTMLVideoElement.prototype.play;
	HTMLVideoElement.prototype.play = function () {
		l('Video.play()', this);
		$AuRo.addEl(this);
		getDeviceId().then(deviceId => {
			this.setSinkId($AuRo.deviceId).then(arg => {
				l('Video.play().getDeviceId().setSinkId()', { deviceId });
				_videoPlay.call(this); 
			});
		}).catch(err => {
			_videoPlay.call(this);
			le(err);
		});
	};

	var _aPlay = Audio.prototype.play;
	Audio.prototype.play = function () {
		l('Video.play()', this);
		$AuRo.addEl(this);
		getDeviceId().then(deviceId => {
			this.setSinkId($AuRo.deviceId).then(arg => {
				l('Video.play().getDeviceId().setSinkId()', { deviceId });
				_aPlay.call(this); 
			});
		}).catch(err => {
			_aPlay.call(this);
			le(err);
		});
	};

	function l (...args) {
		console.log('$AuRo (' + frameDepth + '): ', ...args);
	}
	function le (...args) {
		console.error('$AuRo error!')
		console.log('$AuRo error (' + frameDepth + '): ', ...args);
	}

	l('Monkeypatched');
}

function inject(fn) {
  const script = document.createElement('script')
  script.text = `(${ typeof fn === 'function' ? fn.toString() : fn })();`
  document.documentElement.appendChild(script);
  document.documentElement.removeChild(script);
}

function l (...args) {
	console.log('$AuRo: ', ...args);
}

function onError (err) {
	l('Error: ', err);
}
