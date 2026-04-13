Done

Create new experiment section - 
- Remove base model selection section from here.
- Base model selection should be at run level, not experiment level

Create new run section - 
- here first step should be base model selection
- When you create a new run, and enter run name -  add base model selection here.
- remove both, keep only prompt customization & fine tuning

1. When creating a new run - in addition selecting base model from the drop down, there should be an option to upload model files. [user can provide model by either uploading model files or selecting from the drop down]


2. On the inference tab - add a button to upload eval dataset

3. In the Prompt customization tab
- Add prompt playground section where the user can test the customized model with test prompts and see the model response.
- Add a button called "Prompt Optimizer" - which will make the prompt entered by the user better.
- Add a "Save Prompt in registry" button which will add the prompt to the registry


4. When you create a new experiment - remove the "Next step: After creating your experiment, you'll configure a Run — choosing your base model and customization approach." part. there is no need for this

Some updates: 
- Make the evaluator judge selction a drop down 
- After the user selects metrics and evaluators, the button should say "Evaluate"
- When evaluation run is complete it should open a new card under called evaluation results
    - this card a sub tabs 
        - Eval details: this has details like number of rows in the dataset, model, metrics selected, time etc
        - Summary
            - Aggragated eval results, graphs, chatrs, dashboard
        - Eval results: table with eval dataset (prompt, grounf truth, model response) + score for every metric
        - Insights: insight based on the result
        - Problems: Issues identifed



Evals:

Inside the experiments workflow:

- There should be a card for "Select Evaluation Metrics"
- Under this card, there will be 2 section vertically:
    - On the right side, I want a to show a list of metrics with a short description and an add button. When the user clicks on add, that metric should be added to the list of metrics evaluated. it should also a  remove button for any selected metric.
    - On the left side, i want to show groups of metrics i.e.
            Suites
                Safe
                Secure and Resilient
                Privacy Enhanced
                Fair
                Accountable and Transparent
                Valid and Reliable
                Conceptual Soundness
                Ongoing Monitoring
                Outcomes Analysis
            Purpose
                Generation
                Retrieval
                Privacy
                Fairness
                Summarization
                Classification
                Problems
                Regression
                Classification
                Binary Classification
                Multiclass Classification
                Information Retrieval
                Summarization
                Question Answering
            Method
                Natural Language Inference
                N-gram
                Semantic Similarity
                Judge
                Rule Based
            Method Type
                Deterministic
                Non deterministic
        Every category will have a group of metrics associated with it. when the user selects a category, that group of metric should be visible to the user. this is just to make categorization easier for the user. mutliple categories can be selected at the same time - this should display all metrics for all selected categories.
        I have attached screenshots as examples of the expected UI.

- Select the Evaluator (LLM-as-a-Judge)
    - Provide a list of llms to select from as judges

- button to "Evaluate" which runs the evaluation.

- Compare Runs section

Saving new runs
- This does not work as expected
- The configure run workflow should start with asking the user to name the run
- It should have a create button after the user enters the name as soon as the user clicks on run, the run should be saved in the experiment
- currently, no new runs are being saved - fix this

 when going through the workflow and one step is completed, don't take the user automatically to the next tab if for example, if customization job is complete stay on the same tab and show the status of the completed customization show the config and show the completed logs if the user clicks on the next tab inference then take the user to the next sp similarly once inference is complete. Stay on the inference tab until the user clicks on evaluation.



Major UX change!!!
- The configure run experience should be inside the /experiments/exp-1 page itself, user should not feel like it has left the page or the dashboard or the layout
- Every time "+ New Run" button is clicked, open a Modal to enter the "Run's name" and have a button - CReate run
- This should automatically populate a new entry in the Runs list along with the pre-exsiting runs
- The status of this Run should be "In process to be configure" or something
- Run can be in 3 status - Creation / In-progress / Completed
Creation - Run is in this status when newly created and until Inference step has been saved and user wants to now proceed to Eval
In - progress - Run is in this status when 'inference' process is running
At this point, I am confused what should be the status of a run because at every step that is at prom customization step or prompt fine-tuning step even this step can take hours and marking this run as creation status does not make sense because it should be ideally in progress test test, but user should know exactly at what stage of in progress is this run actually exist so help me brain stop exactly how do I communicate this to the user and what should be the status of the run?
- Coming back to the configure run process, when a new run is created after use click on creatae run modal, the expereince should be the same as the 
/exp-1775356423444/runs/new - but i dont want a new page for this, rather it should be inside the customization tab itself, and same for inference and evals
- Whole idea is to get rid of the /exp-1775356423444/runs/new  and add this expereince in the  /experiments/exp-1 page itself



We need to create a new eval page which is going to be independent of all the experiments and users can come to this platform and just run emails with some additional input like data set. That's it and experience should be exactly same. It should not be a learning cover for the users who are running eval inside the runs or running eval separately independent of run experiments so my guess is that this eval speech discovery is gonna be right below experimentation menu on the left navigation bar.

Make these updates :
1. In the inference tab - remove the eval dataset drop down, the only option to get eval dataset is via upload eval dataset

2. Add "Create custom metric" section in metrics card : users should be able to create a new metric and add it to the metric list


- The create custom metric section is at the end of the metrics card. Make it sticky in the same card, so that its visible in the metric section all the time.

- On the evaluations tab - in the left panel which has Suites,Purpose etc. rearraneg the order - Put Method type at the top, then Suite, Purpose, Method

- In create custom metric - after user clicks on the "create custom metric" button, there should be a toggle button where the user select "LLM Judge Metrix" or "Rule-based Metric"


-LLM Jury
Under "Select Evaluator (LLM-as-a-Judge)" 
- Update this to "Select Evaluator" - here the user has 2 options "LLM-as-a-Judge" and "LLM Jury"
- "LLM-as-a-Judge" will have a drop down to select judge
- In "LLM Jury" the user can select 3 lLM and the result will be a concensus based result between the jury


UI change:
- The font size across the project is not consistent. Make the font size appropriate and consistent according to the feature and importance
- Add good padding in the project to make it visually aesthetic
- Rename the app to "Model Customization"
- The size of the elements in the left panel after clicking on experiments/evaluations is not visually apealling, resize it and make it slightly bigger

------------------------------------------------------------------------------------------------------
------------------------------------------------------------------------------------------------------

To Be Done


- Propmt Customization - update the Job logs status, it shows fine tuning status


- Prompt Evals
- Prompt Registry

- Progress bar for each run

Fine tuning section - 
- After the config selection section, there should be a button for Run Fine tuing Job
- When the user clicks on this button, it triggers the fine tuning run and it opens a log sefction which show the real time logs of the status of the fine tuning job


Evaluation section
- Have a field to set evaluation run name


RunStatus = 
When user cr'Draft' | 'Configuring' | 'Training' | 'Inferring' | 'Evaluating' | 'Completed' | 'Failed';


Customization tab
- After running the customizatino job, it is showing 'Save and Re-run'. this is not the expected behavior
- After the  user enters the customization configs and clicks on run customization job, it should open a new card showing the job status logs in real time.
- After the job is completed, it should show the configs mentioend by the user and the logs.
- Once the customization run is complete, the configs should not be editable.


Rule based metric - programmatic metrics - should have a code interface