* Synthetic Data Generation
* Generate Goldens
* From Goldens

On this page

Generate Goldens From Goldens
=============================

`deepeval` enables you to **generate synthetic goldens from an existing set of goldens**, without requiring any documents or context. This is ideal for quickly expanding or adding more complexity to your evaluation dataset.

![](../images/60eda456.svg)

tip

By default, `generate_goldens_from_goldens` extracts `StylingConfig` from your existing Golden, but it is recommended to [provide a `StylingConfig` explicitly](/docs/synthesizer-introduction#styling-options) for better accuracy and consistency.

Generate Your Goldens[​](#generate-your-goldens "Direct link to Generate Your Goldens")
---------------------------------------------------------------------------------------

To get started, simply define a `Synthesizer` object and pass in your list of existing goldens. Note that you can only generate single-turn goldens from existing single-turn ones, and vice versa.

* Single-Turn
* Multi-Turn

```
from deepeval.synthesizer import Synthesizer  
  
synthesizer = Synthesizer()  
goldens = synthesizer.generate_goldens_from_goldens(  
  goldens=goldens,  
  max_goldens_per_golden=2,  
  include_expected_output=True,  
)
```

There is **ONE** mandatory and **TWO** optional parameter when using the `generate_goldens_from_goldens` method:

* `goldens`: a list of existing Goldens from which the new Goldens will be generated.
* [Optional] `max_goldens_per_golden`: the maximum number of goldens to be generated per golden. Defaulted to 2.
* [Optional] `include_expected_output`: a boolean which when set to `True`, will additionally generate an `expected_output` for each synthetic `Golden`. Defaulted to `True`.

WARNING

The generated goldens will contain `expected_output` **ONLY** if your existing goldens contain `context`. This is to ensure that the `expected_output`s are grounded in truth and are not hallucinated.

```
from deepeval.synthesizer import Synthesizer  
  
synthesizer = Synthesizer()  
conversational_goldens = synthesizer.generate_conversational_goldens_from_goldens(  
  goldens=goldens,  
  max_goldens_per_golden=2,  
  include_expected_outcome=True,  
)
```

There is **ONE** mandatory and **TWO** optional parameter when using the `generate_conversational_goldens_from_goldens` method:

* `goldens`: a list of existing Goldens from which the new Goldens will be generated.
* [Optional] `max_goldens_per_golden`: the maximum number of goldens to be generated per golden. Defaulted to 2.
* [Optional] `include_expected_outcome`: a boolean which when set to `True`, will additionally generate an `expected_outcome` for each synthetic `ConversationalGolden`. Defaulted to `True`.

info

If your existing Goldens include `context`, the synthesizer will utilize these contexts to generate synthetic Goldens, ensuring they are grounded in truth. If no context is present, the synthesizer will employ the `generate_from_scratch` method to create additional inputs based on provided inputs.

[Edit this page](https://github.com/confident-ai/deepeval/edit/main/docs/docs/synthesizer-generate-from-goldens.mdx)

Last updated on **Jan 9, 2026** by **Jeffrey Ip**