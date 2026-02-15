* Synthetic Data Generation
* Generate Goldens
* From Contexts

On this page

Generate Goldens From Contexts
==============================



If you already have prepared contexts, you can skip document processing. Simply provide these contexts to `deepeval`'s `Synthesizer`, and it will generate goldens directly without processing documents.

![LangChain](../images/9bec1797.svg)

tip

This is especially helpful if you **already have an embedded knowledge base**. For example, if you have documents parsed and stored in a vector database, you may handle retrieving text chunks yourself.

Generate Your Goldens[​](#generate-your-goldens "Direct link to Generate Your Goldens")
---------------------------------------------------------------------------------------

To generate synthetic single or multi-turn goldens from documents, simply provide a list of contexts:

* Single-Turn
* Multi-Turn

```
from deepeval.synthesizer import Synthesizer  
  
synthesizer = Synthesizer()  
goldens = synthesizer.generate_goldens_from_contexts(  
    # Provide a list of context for synthetic data generation  
    contexts=[  
        ["The Earth revolves around the Sun.", "Planets are celestial bodies."],  
        ["Water freezes at 0 degrees Celsius.", "The chemical formula for water is H2O."],  
    ]  
)
```

There are **ONE** mandatory and **THREE** optional parameters when using the `generate_goldens_from_contexts` method:

* `contexts`: a list of context, where each context is itself a list of strings, ideally sharing a common theme or subject area.
* [Optional] `include_expected_output`: a boolean which when set to `True`, will additionally generate an `expected_output` for each synthetic `Golden`. Defaulted to `True`.
* [Optional] `max_goldens_per_context`: the maximum number of goldens to be generated per context. Defaulted to 2.
* [Optional] `source_files`: a list of strings specifying the source of the contexts. Length of `source_files` **MUST** be the same as the length of `contexts`.

DID YOU KNOW?

The `generate_goldens_from_docs()` method calls the `generate_goldens_from_contexts()` method under the hood, and the only difference between the two is the `generate_goldens_from_contexts()` method does not contain a [context construction step](/docs/synthesizer-generate-from-docs#how-does-context-construction-work), but instead uses the provided contexts directly for generation.

```
from deepeval.synthesizer import Synthesizer  
  
synthesizer = Synthesizer()  
conversational_goldens = synthesizer.generate_conversational_goldens_from_contexts(  
    # Provide a list of context for synthetic data generation  
    contexts=[  
        ["The Earth revolves around the Sun.", "Planets are celestial bodies."],  
        ["Water freezes at 0 degrees Celsius.", "The chemical formula for water is H2O."],  
    ]  
)
```

There are **ONE** mandatory and **THREE** optional parameters when using the `generate_conversational_goldens_from_contexts` method:

* `contexts`: a list of context, where each context is itself a list of strings, ideally sharing a common theme or subject area.
* [Optional] `include_expected_outcome`: a boolean which when set to `True`, will additionally generate an `expected_outcome` for each synthetic `ConversationalGolden`. Defaulted to `True`.
* [Optional] `max_goldens_per_context`: the maximum number of goldens to be generated per context. Defaulted to 2.
* [Optional] `source_files`: a list of strings specifying the source of the contexts. Length of `source_files` **MUST** be the same as the length of `contexts`.

DID YOU KNOW?

The `generate_conversational_goldens_from_docs()` method calls the `generate_conversational_goldens_from_contexts()` method under the hood, and the only difference between the two is the `generate_conversational_goldens_from_contexts()` method does not contain a [context construction step](/docs/synthesizer-generate-from-docs#how-does-context-construction-work), but instead uses the provided contexts directly for generation.

Remember, single-turn generations produces single-turn `Golden`s, while multi-turn generations produces multi-turn `ConversationalGolden`s. To learn more about goldens, [click here.](/docs/evaluation-datasets#what-are-goldens)

[Edit this page](https://github.com/confident-ai/deepeval/edit/main/docs/docs/synthesizer-generate-from-contexts.mdx)

Last updated on **Jan 9, 2026** by **Jeffrey Ip**