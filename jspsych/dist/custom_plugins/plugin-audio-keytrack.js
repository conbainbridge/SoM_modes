var JsPsychAudioKeytrack = (function (jspsych) {
    'use strict';
  
    const info = {
        name: "audio-keytrack",
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
            /** Label of the button to submit responses. */
            button_label: {
                type: jspsych.ParameterType.STRING,
                pretty_name: "Button label",
                default: "Continue",
            },
            trial_duration: {
              type: jspsych.ParameterType.INT,
              pretty_name: 'Trial duration',
              default: null,
              description: 'The maximum duration to wait for a response.'
            },
            // Below are from keytrack/survey plugin
            /** Placeholder text in the response text box. */
            prompt: {
                type: jspsych.ParameterType.HTML_STRING,
                pretty_name: "Prompt",
                default: undefined,
            },
            placeholder: {
                type: jspsych.ParameterType.STRING,
                pretty_name: "Placeholder",
                default: "",
            },
            /** The number of rows for the response text box. */
            rows: {
                type: jspsych.ParameterType.INT,
                pretty_name: "Rows",
                default: 1,
            },
            /** The number of columns for the response text box. */
            columns: {
                type: jspsych.ParameterType.INT,
                pretty_name: "Columns",
                default: 40,
            },
            /** Whether or not a response to this question must be given in order to continue. */
            required: {
                type: jspsych.ParameterType.BOOL,
                pretty_name: "Required",
                default: false,
            }
        },
    };
    /**
     * **survey-text**
     *
     * jsPsych plugin for think-aloud free text response survey questions, with both audio and text recorded, including keystroke data. Includes countdown timer.
     *
     * @author Constance Bainbridge
     * @author Josh de Leeuw
     */
    class AudioKeytrackPlugin {
        constructor(jsPsych) {
            this.jsPsych = jsPsych;
            this.rt = null;
            this.recorded_data_chunks = [];
            this.keypresses = [];
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
              
              if (trial.show_done_button) {
                  html += `<p><button class="jspsych-btn" id="finish-trial">${trial.done_button_label}</button></p>`;
              }
            }
            // add prompt
            // start form
            html += '<form id="jspsych-survey-text-form" autocomplete="off">'
            html += '<div id="jspsych-survey-text-form" class="jspsych-survey-text-question" style="margin: 2em 0em;">';
            html += '<p class="jspsych-survey-text">' + trial.prompt + "</p>";
            // var autofocus = i == 0 ? "autofocus" : "";
            var req = trial.required ? "required" : "";

            html += '<textarea id="input-text-trial" name="#jspsych-survey-text-response" cols="' + trial.columns +
                '" rows="' + trial.rows + '" ' +
                // autofocus + 
                " " + req +
                ' placeholder="' + trial.placeholder +
            '"></textarea>';
            html += "</div>";
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

            // Save all keys
            var keypresses = [];
            document.onkeydown = function (e) {
                var time = e.timeStamp;
                var keydata = {
                    "key": e.key,
                    "key_code": e.code,
                    "key_time": time
                };
                keypresses.push(keydata)
            }
            this.keypresses = keypresses;

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
                // this.addButtonEvent(display_element, trial);
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
            var q_element = document.querySelector("textarea, input");
            var text_response = q_element.value;
            // Object.assign(text_response, val);

            var trial_data = {
                // rt: this.rt,
                stimulus: trial.stimulus,
                audio_response: this.response,
                text_response: text_response,
                key_tracking: this.keypresses,
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
    AudioKeytrackPlugin.info = info;
  
    return AudioKeytrackPlugin;
  
  })(jsPsychModule);
  