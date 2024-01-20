var JsPsychSurveyKeytrack = (function (jspsych) {
  'use strict';

  const info = {
      name: "survey-keytrack",
      parameters: {
          prompt: {
              type: jspsych.ParameterType.HTML_STRING,
              pretty_name: "Prompt",
              default: undefined,
            },
            /** Placeholder text in the response text box. */
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
            },
            countdown: {
                type: jspsych.ParameterType.BOOL,
                default: true,
            },
            show_done_button: {
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
        },
    };
    /**
     * **survey-text**
     *
     * jsPsych plugin for free text response survey questions adapted to include keytracking. Includes countdown timer.
     *
     * @author Constance Bainbridge
     * @author Josh de Leeuw
     */
    class SurveyKeytrackPlugin {
        constructor(jsPsych) {
            this.jsPsych = jsPsych;
            this.rt = null;
            this.keypresses = [];
        }
        trial(display_element, trial) {
            let html = "";
            
            //Initialize countdown
            if (trial.countdown) {
                var countdown;
                var min;
                var sec;
                if(trial.trial_duration >= 1000) {
                    if (trial.trial_duration >= 60000) {
                        var minsetup = (trial.trial_duration/1000); // 66,000 / 1000 = 66
                        min = Math.trunc((trial.trial_duration/1000)/60);
                        var modulus = minsetup % 60;
                        sec = modulus
                        countdown = min + ' min ' + sec +' sec'
                        html += '<div align="right" style="margin-top:15px"><b>Time remaining:<br><div id="jspsych-html-survey-keytrack-countdown" size=14>'+countdown+'</div></b></div>';
                    } else {
                        countdown = Math.trunc(trial.trial_duration/1000)
                        countdown = countdown +' sec'
                        html += '<div align="right" style="margin-top:15px"><b>Time remaining:<br><div id="jspsych-html-survey-keytrack-countdown" size=14>'+countdown+'</div></b></div>';
                    }
                } else {
                    console.log("Trial duration is too short for countdown timer.")
                }
            }
            // start form
            html += '<form id="jspsych-html-survey-keytrack-form" autocomplete="off">'
            html += '<div id="jspsych-html-survey-keytrack-form" class="jspsych-html-survey-keytrack-question" style="margin: 2em 0em;">';
            html += '<p class="jspsych-html-survey-keytrack">' + trial.prompt + "</p>";
            // var autofocus = i == 0 ? "autofocus" : "";
            var req = trial.required ? "required" : "";

            html += '<textarea id="input-text-trial" name="#jspsych-html-survey-keytrack-response" cols="' + trial.columns +
                '" rows="' + trial.rows + '" ' +
                // autofocus + 
                " " + req +
                ' placeholder="' + trial.placeholder +
            '"></textarea>';
            html += "</div>";
            if (trial.show_done_button) {
                html += `<p><button class="jspsych-btn" id="finish-trial">${trial.button_label}</button></p>`;
            }
            display_element.innerHTML = html;

            // Start countdown
            var textElement = document.getElementById('jspsych-html-survey-keytrack-countdown');
            var minsetup = (trial.trial_duration/1000); // 66,000 / 1000 = 66
            min = Math.trunc((trial.trial_duration/1000)/60);
            var modulus = minsetup % 60;
            sec = modulus
            console.log(textElement.innerHTML)
            function myTimer () {
                if (sec > 0) {
                    if (sec == 1) {
                        sec = sec + 60;
                        countdown = min + ' min 0 sec';
                        min = min - 1;
                        textElement.innerHTML = countdown;
                    } else {
                        if (min == 0) {
                            countdown = (sec-1) +' sec';
                            textElement.innerHTML = countdown;
                        } else {
                            countdown = min + ' min '+ (sec-1) +' sec';
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
            if (trial.trial_duration != null) {
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

            const endTrial = () => {
                // kill any remaining setTimeout handlers
                this.jsPsych.pluginAPI.clearAllTimeouts();
                // gather the data to store for the trial
                var q_element = document.querySelector("textarea, input");
                var text_response = q_element.value;
                // Object.assign(text_response, val);
    
                var trial_data = {
                    // rt: this.rt,
                    stimulus: trial.prompt,
                    text_response: text_response,
                    key_tracking: this.keypresses
                };
                // clear the display
                display_element.innerHTML = "";
                // move on to the next trial
                this.jsPsych.finishTrial(trial_data);
            }

            // end trial if time limit is set
            if (trial.trial_duration !== null) {
                this.jsPsych.pluginAPI.setTimeout(endTrial, trial.trial_duration);
            }
        }
    }
    SurveyKeytrackPlugin.info = info;
  
    return SurveyKeytrackPlugin;
  
  })(jsPsychModule);
  