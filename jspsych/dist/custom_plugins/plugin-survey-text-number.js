var SurveyTextNumPlugin = (function (jspsych) {
  'use strict';

  const info = {
    name: 'survey-text-number',
    parameters: {
      questions: {
        type: jspsych.ParameterType.COMPLEX,
        array: true,
        pretty_name: 'Questions',
        nested: {
          prompt: {
            type: jspsych.ParameterType.HTML_STRING,
            pretty_name: 'Prompt',
            default: undefined,
            description: 'Prompt for the subject to response'
          },
          min_number: {
            type: jspsych.ParameterType.INT,
            pretty_name: 'Min value',
            default: 3,
            description: 'Determines minimum number option.'
          },
          max_number: {
            type: jspsych.ParameterType.HTML_STRING,
            pretty_name: 'Max value',
            default: 118,
            description: 'Determines maximum number option'
          },
          value: {
            type: jspsych.ParameterType.INT,
            pretty_name: 'Value',
            default: "",
            description: 'The string will be used to populate the response field with editable answer.'
          },
          rows: {
            type: jspsych.ParameterType.INT,
            pretty_name: 'Rows',
            default: 1,
            description: 'The number of rows for the response text box.'
          },
          columns: {
            type: jspsych.ParameterType.INT,
            pretty_name: 'Columns',
            default: 40,
            description: 'The number of columns for the response text box.'
          }
        }
      },
      preamble: {
        type: jspsych.ParameterType.HTML_STRING,
        pretty_name: 'Preamble',
        default: null,
        description: 'HTML formatted string to display at the top of the page above all the questions.'
      },
      button_label: {
        type: jspsych.ParameterType.HTML_STRING,
        pretty_name: 'Button label',
        default:  'Continue',
        description: 'The text that appears on the button to finish the trial.'
      },
      alert_text: {
        type: jspsych.ParameterType.HTML_STRING,
        pretty_name: 'Alert text',
        default:  'Please select your age from the dropdown menu',
        description: 'The text that appears if a number has not been selected.'
      }
    }
  };
  /**
   * **survey-text**
   *
   * jsPsych plugin for free text response survey questions adapted to include keytracking. Includes countdown timer.
   *
   * @author Constance Bainbridge
   * @author Josh de Leeuw
   */
  class SurveyTextNumPlugin {
      constructor(jsPsych) {
          this.jsPsych = jsPsych;
      }
      trial(display_element, trial) {
        for (var i = 0; i < trial.questions.length; i++) {
          if (typeof trial.questions[i].rows == 'undefined') {
            trial.questions[i].rows = 1;
          }
        }
        for (var i = 0; i < trial.questions.length; i++) {
          if (typeof trial.questions[i].columns == 'undefined') {
            trial.questions[i].columns = 40;
          }
        }
        for (var i = 0; i < trial.questions.length; i++) {
          if (typeof trial.questions[i].value == 'undefined') {
            trial.questions[i].value = "";
          }
        }

        var html = '';
        // show preamble text
        if(trial.preamble !== null){
          html += '<div id="jspsych-survey-text-number-preamble" class="jspsych-survey-text-number-preamble">'+trial.preamble+'</div>';
        }
        // add questions
        for (var i = 0; i < trial.questions.length; i++) {
          html += '<div id="jspsych-survey-text-number-"'+i+'" class="jspsych-survey-text-number-question" style="margin: 2em 0em;">';
          html += '<p class="jspsych-survey-text-number">' + trial.questions[i].prompt + '</p>';
          html += '';
          html += '<select>'
          html += '<option value="-" selected disabled>-</option>'
          if (trial.questions[i].min_number && trial.questions[i].max_number) {
            for (var j = trial.questions[i].min_number; j < trial.questions[i].max_number+1; j++) {
              html += '<option value='+j+'>'+j+'</option>'
            }
          } else if (trial.questions[i].min_number && !trial.questions[i].max_number) {
            for (var j = trial.questions[i].min_number; j < 119; j++) {
              html += '<option value='+j+'>'+j+'</option>'
            }
          } else if (!trial.questions[i].min_number && trial.questions[i].max_number) {
            for (var j = 3; j < trial.questions[i].max_number+1; j++) {
              html += '<option value='+j+'>'+j+'</option>'
            }
          } else {
            for (var j = 3; j < 119; j++) {
              html += '<option value='+j+'>'+j+'</option>'
            }
          }
          html += '</select> years old.'
          html += '</div>';
        }

        // add submit button
        html += '<button id="jspsych-survey-text-number-next" class="jspsych-btn jspsych-survey-text-number">'+trial.button_label+'</button>';

        display_element.innerHTML = html;

        display_element.querySelector('#jspsych-survey-text-number-next').addEventListener('click', function() {
          // measure response time
          var endTime = (new Date()).getTime();
          var response_time = endTime - startTime;

          // create object to hold responses
          let questionText = [];
          for(i = 0; i < trial.questions.length; i++){
            questionText = trial.questions[i].prompt
          };
          var question_data = {};
          var matches = display_element.querySelectorAll('div.jspsych-survey-text-number-question');
          for(var index=0; index<matches.length; index++){
            var id = "Q" + index + " - " + questionText;
            var val = matches[index].querySelector('select, input').value;
            var obje = {};
            obje[id] = val;
            Object.assign(question_data, obje);
          }
          // save data
          var trialdata = {
            "rt": response_time,
            "responses": JSON.stringify(question_data)
          };

      if (val != "-") {
          display_element.innerHTML = '';
          // next trial
          jsPsych.finishTrial(trialdata);
      } if (val == "-") {
          if (trial.alert_text) {
            alert(trial.alert_text);
          } else {
            alert('Please select your age from the dropdown menu')
          }
        }
    });

        var startTime = (new Date()).getTime();
      };
  }
  SurveyTextNumPlugin.info = info;

  return SurveyTextNumPlugin;

})(jsPsychModule);
