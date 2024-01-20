var jsPsychHtmlAudioCountdown = (function (jspsych) {
  'use strict';

  const info = {
      name: "html-audio-countdown",
      parameters: {
          /** The HTML string to be displayed */
          stimulus: {
              type: jspsych.ParameterType.HTML_STRING,
              default: undefined,
          },
          /** How long to show the stimulus. */
          stimulus_duration: {
              type: jspsych.ParameterType.INT,
              default: null,
          },
          /** How long to show the trial. */
          recording_duration: {
              type: jspsych.ParameterType.INT,
              default: 2000,
          },
          /** Whether to show the countdown timer or not */
          countdown: {
            type: jspsych.ParameterType.BOOL,
            default: true,
          },
          /** Whether or not to show a button to end the recording. If false, the recording_duration must be set. */
          show_done_button: {
              type: jspsych.ParameterType.BOOL,
              default: true,
          },
          /** Label for the done (stop recording) button. Only used if show_done_button is true. */
          done_button_label: {
              type: jspsych.ParameterType.STRING,
              default: "Continue",
          },
          /** Label for the record again button (only used if allow_playback is true). */
          record_again_button_label: {
              type: jspsych.ParameterType.STRING,
              default: "Record again",
          },
          /** Label for the button to accept the audio recording (only used if allow_playback is true). */
          accept_button_label: {
              type: jspsych.ParameterType.STRING,
              default: "Continue",
          },
          /** Whether or not to allow the participant to playback the recording and either accept or re-record. */
          allow_playback: {
              type: jspsych.ParameterType.BOOL,
              default: false,
          },
          /** Whether or not to save the video URL to the trial data. */
          save_audio_url: {
              type: jspsych.ParameterType.BOOL,
              default: false,
          },
      },
  };
  /**
   * html-audio-response
   * jsPsych plugin for displaying a stimulus and recording an audio response through a microphone
   * @author Josh de Leeuw
   * @see {@link https://www.jspsych.org/plugins/jspsych-html-audio-response/ html-audio-response plugin documentation on jspsych.org}
   */
  class HtmlAudioCountdownPlugin {
      constructor(jsPsych) {
          this.jsPsych = jsPsych;
          this.rt = null;
          this.recorded_data_chunks = [];
      }
      trial(display_element, trial) {
          this.recorder = this.jsPsych.pluginAPI.getMicrophoneRecorder();
          this.setupRecordingEvents(display_element, trial);
          this.startRecording();
      }
      showDisplay(display_element, trial) {
          const ro = new ResizeObserver((entries, observer) => {
              this.stimulus_start_time = performance.now();
              observer.unobserve(display_element);
              //observer.disconnect();
          });
          ro.observe(display_element);
          let html = ``;
         
          //Initialize countdown
          if (trial.countdown) {
            var countdown;
            var min;
            var sec;
            if(trial.recording_duration >= 1000) {
              if (trial.recording_duration >= 60000) {
                var minsetup = (trial.recording_duration/1000); // 66,000 / 1000 = 66
                min = Math.trunc((trial.recording_duration/1000)/60);
                var modulus = minsetup % 60;
                sec = modulus
                countdown = min + ' min ' + sec +' sec'
                html += '<div align="right" style="margin-top:15px"><b>Time remaining:<br><div id="jspsych-survey-text-countdown" size=14>'+countdown+'</div></b></div>';
                html += `<div id="jspsych-html-audio-response-stimulus">${trial.stimulus}</div>`;
              } else {
                  countdown = Math.trunc(trial.recording_duration/1000)
                  countdown = countdown +' sec'
                  html += '<div align="right" style="margin-top:15px"><b>Time remaining:<br><div id="jspsych-survey-text-countdown" size=14>'+countdown+'</div></b></div>';
                  html += `<div id="jspsych-html-audio-response-stimulus">${trial.stimulus}</div>`;
              }
            } else {
                console.log("Trial duration is too short for countdown timer.")
                html += `<div id="jspsych-html-audio-response-stimulus">${trial.stimulus}</div>`;
            }
            
            if (trial.recording_duration == null) {
                html += `<p><button class="jspsych-btn" id="finish-trial">${trial.done_button_label}</button></p>`;
            }
          }

          display_element.innerHTML = html;

            // Start countdown
            var textElement = document.getElementById('jspsych-survey-text-countdown');
            var minsetup = (trial.recording_duration/1000); // 66,000 / 1000 = 66
            min = Math.trunc((trial.recording_duration/1000)/60);
            var modulus = minsetup % 60;
            sec = modulus
            console.log(textElement.innerHTML)
            function myTimer () {
                if (sec > 0) {
                    if (sec == 1) {
                        sec = sec + 60
                        countdown = min + ' min 0 sec'
                        min = min - 1;
                        textElement.innerHTML = countdown;
                    } else {
                        if (min == 0) {
                            countdown = (sec-1) +' sec'
                            textElement.innerHTML = countdown;
                        } else {
                            countdown = min + ' min '+ (sec-1) +' sec'
                            textElement.innerHTML = countdown;
                        }
                    }
                    if (--sec < 0 && min < 1) {
                        console.log('trigger')
                        sec = 0;
                    }
                } else {
                    min = min - 1;
                    sec = sec + 59
                    countdown = min + ' min ' + sec +' sec'
                    textElement.innerHTML = countdown;
                }
            }
            var timerInterval
            function myStopFunction() {
                clearInterval(timerInterval);
            }
            // Start Countdown
            // (enabled by default)
            if (trial.recording_duration != null) {
                timerInterval = setInterval(myTimer, 1000);
            }
      }
      hideStimulus(display_element) {
          const el = display_element.querySelector("#jspsych-html-audio-response-stimulus");
          if (el) {
              el.style.visibility = "hidden";
          }
      }
      addButtonEvent(display_element, trial) {
          const btn = display_element.querySelector("#finish-trial");
          if (btn) {
              btn.addEventListener("click", () => {
                  const end_time = performance.now();
                  this.rt = Math.round(end_time - this.stimulus_start_time);
                  this.stopRecording().then(() => {
                      if (trial.allow_playback) {
                          this.showPlaybackControls(display_element, trial);
                      }
                      else {
                          this.endTrial(display_element, trial);
                      }
                  });
              });
          }
      }
      setupRecordingEvents(display_element, trial) {
          this.data_available_handler = (e) => {
              if (e.data.size > 0) {
                  this.recorded_data_chunks.push(e.data);
              }
          };
          this.stop_event_handler = () => {
              const data = new Blob(this.recorded_data_chunks, { type: "audio/webm" });
              this.audio_url = URL.createObjectURL(data);
              const reader = new FileReader();
              reader.addEventListener("load", () => {
                  const base64 = reader.result.split(",")[1];
                  this.response = base64;
                  this.load_resolver();
              });
              reader.readAsDataURL(data);
          };
          this.start_event_handler = (e) => {
              // resets the recorded data
              this.recorded_data_chunks.length = 0;
              this.recorder_start_time = e.timeStamp;
              this.showDisplay(display_element, trial);
              this.addButtonEvent(display_element, trial);
              // setup timer for hiding the stimulus
              if (trial.stimulus_duration !== null) {
                  this.jsPsych.pluginAPI.setTimeout(() => {
                      this.hideStimulus(display_element);
                  }, trial.stimulus_duration);
              }
              // setup timer for ending the trial
              if (trial.recording_duration !== null) {
                  this.jsPsych.pluginAPI.setTimeout(() => {
                      // this check is necessary for cases where the
                      // done_button is clicked before the timer expires
                      if (this.recorder.state !== "inactive") {
                          this.stopRecording().then(() => {
                              if (trial.allow_playback) {
                                  this.showPlaybackControls(display_element, trial);
                              }
                              else {
                                  this.endTrial(display_element, trial);
                              }
                          });
                      }
                  }, trial.recording_duration);
              }
          };
          this.recorder.addEventListener("dataavailable", this.data_available_handler);
          this.recorder.addEventListener("stop", this.stop_event_handler);
          this.recorder.addEventListener("start", this.start_event_handler);
      }
      startRecording() {
          this.recorder.start();
      }
      stopRecording() {
          this.recorder.stop();
          return new Promise((resolve) => {
              this.load_resolver = resolve;
          });
      }
      showPlaybackControls(display_element, trial) {
          display_element.innerHTML = `
      <p><audio id="playback" src="${this.audio_url}" controls></audio></p>
      <button id="record-again" class="jspsych-btn">${trial.record_again_button_label}</button>
      <button id="continue" class="jspsych-btn">${trial.accept_button_label}</button>
    `;
          display_element.querySelector("#record-again").addEventListener("click", () => {
              // release object url to save memory
              URL.revokeObjectURL(this.audio_url);
              this.startRecording();
          });
          display_element.querySelector("#continue").addEventListener("click", () => {
              this.endTrial(display_element, trial);
          });
          // const audio = display_element.querySelector('#playback');
          // audio.src =
      }
      endTrial(display_element, trial) {
          // clear recordering event handler
          this.recorder.removeEventListener("dataavailable", this.data_available_handler);
          this.recorder.removeEventListener("start", this.start_event_handler);
          this.recorder.removeEventListener("stop", this.stop_event_handler);
          // kill any remaining setTimeout handlers
          this.jsPsych.pluginAPI.clearAllTimeouts();
          // gather the data to store for the trial
          var trial_data = {
              rt: this.rt,
              stimulus: trial.stimulus,
              response: this.response,
              estimated_stimulus_onset: Math.round(this.stimulus_start_time - this.recorder_start_time),
          };
          if (trial.save_audio_url) {
              trial_data.audio_url = this.audio_url;
          }
          else {
              URL.revokeObjectURL(this.audio_url);
          }
          // clear the display
          display_element.innerHTML = "";
          // move on to the next trial
          this.jsPsych.finishTrial(trial_data);
      }
  }
  HtmlAudioCountdownPlugin.info = info;

  return HtmlAudioCountdownPlugin;

})(jsPsychModule);
