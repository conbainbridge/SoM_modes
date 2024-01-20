var jsPsychSurveyTextDropdown = (function (jspsych) {
  'use strict';

  const info = {
    name: 'survey-text-dropdown',
    description: '',
    parameters: {
      questions: {
        type: jspsych.ParameterType.COMPLEX,
        array: true,
        pretty_name: 'Questions',
        default: undefined,
        nested: {
          prompt: {
            type: jspsych.ParameterType.STRING,
            pretty_name: 'Prompt',
            default: undefined,
            description: 'Prompt for the subject to response'
          },
          choices: {
            type: jspsych.ParameterType.STRING,
            pretty_name: 'Choices',
            default: undefined,
            description: 'Choices for dropdown'
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
        type: jspsych.ParameterType.STRING,
        pretty_name: 'Preamble',
        default: null,
        description: 'HTML formatted string to display at the top of the page above all the questions.'
      },
      alert: {
        type: jspsych.ParameterType.STRING,
        pretty_name: 'Alert',
        default: 'Please make a selection from the dropdown menu.',
        description: 'Alert message.'
      },
      button_label: {
        type: jspsych.ParameterType.STRING,
        pretty_name: 'Button label',
        default:  'Continue',
        description: 'The text that appears on the button to finish the trial.'
      }
    }
  }
  /**
  * @author Constance Bainbridge
  * @author Josh de Leeuw
  **/
  class SurveyTextDropdownPlugin {
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
      for (var i = 0; i < trial.questions.length; i++) {
        if (typeof trial.questions[i].choices == 'undefined') {
          trial.questions[i].choices = "";
        }
      }

      var html = '';
      // show preamble text
      if(trial.preamble !== null){
        html += '<div id="jspsych-survey-text-dropdown-preamble" class="jspsych-survey-text-dropdown-preamble">'+trial.preamble+'</div>';
      }
      // add questions
      for (var i = 0; i < trial.questions.length; i++) {
        html += '<div id="jspsych-survey-text-dropdown-"'+i+'" class="jspsych-survey-text-dropdown-question" style="margin: 2em 0em;">';
        html += '<p class="jspsych-survey-text-dropdown">' + trial.questions[i].prompt + '</p>';
        html += '<select>'
        html += '<option value="-" selected disabled>-</option>'
        for (var j = 0; j < trial.questions[0].choices.length; j++) {
          html += '<option value="name: '+trial.questions[0].choices[j]+'">'+trial.questions[0].choices[j]+'</option>'
        }
        html += '</select>'
        html += '</div>';
      }

      // add submit button
      html += '<button id="jspsych-survey-text-dropdown-next" class="jspsych-btn jspsych-survey-text-dropdown">'+trial.button_label+'</button>';

      display_element.innerHTML = html;
    
      display_element.querySelector('#jspsych-survey-text-dropdown-next').addEventListener('click', function() {
        // measure response time
        var endTime = (new Date()).getTime();
        var response_time = endTime - startTime;

        // create object to hold responses
        let questionText = [];
        for(i = 0; i < trial.questions.length; i++){
          questionText = trial.questions[i].prompt
        };
        var question_data = {};
        var matches = display_element.querySelectorAll('div.jspsych-survey-text-dropdown-question');
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
        jsPsych.finishTrial(trialdata);
      });

      var startTime = (new Date()).getTime();
    }
  }
  SurveyTextDropdownPlugin.info = info;
  
  return SurveyTextDropdownPlugin;

})(jsPsychModule);