we are building a model customization workflow

starting with

every new entry is an "Experiment"

An experiment can have multiple "Runs"

One "Run" can have following steps in the pipeline

Section 1
Customize your LLM
A - Prompt Customization
So this is essentially a less invasive way to customize the model, which where in the user will provide either system, prompt or user template or template or like few short examples, essentially providing external context to the large language model to customize it to the specific language of the user
OR / AND
B - Fine tuning
Fine-tuning is a more invasive way of customization whether the user can tune parameters of the base model and customize it to specific domains or use cases and the methods that I want to cover your RSFTF 
H20.AI alaready has it ready and i think we can take some inpisration from them - https://github.com/h2oai/h2o-llmstudio


Section 2
Inference 
So the step is basically used to generate responses from the customized model in the previous step across the evaluation prompts that the user specified so this step essentially hits the model and point or loads the model and asks the model the prompts that are mentioned in the data set and generate resp


Section 3
Evaluation
This step helps the user to evaluate their fine model in the previous step or the prompt customized model in the previous step to measure their model across certain metrics using LM as a large or base scorers or like any different types of scorers, but it is it essentially provides the performance of the model on those metrics and so that the user can make a decision on whether or not the model is performing well

H20.AI has a very interesting UI/UX setup for this and I would be really fine taking entire inspiration from their design and flow  https://eval-studio.genai.h2o.ai/