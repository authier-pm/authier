"""MiniLM with separate code-presence and source-span outputs, sharing one encoder."""

from dataclasses import dataclass

import torch
from torch.nn import functional as F
from transformers import BertModel, BertPreTrainedModel
from transformers.utils import ModelOutput


@dataclass
class SmsExtractionOutput(ModelOutput):
    loss: torch.Tensor | None = None
    start_logits: torch.Tensor | None = None
    end_logits: torch.Tensor | None = None
    presence_logits: torch.Tensor | None = None
    code_token_logits: torch.Tensor | None = None


class SmsExtractor(BertPreTrainedModel):
    def __init__(self, config):
        super().__init__(config)
        config.sms_presence_head = True
        self.bert = BertModel(config, add_pooling_layer=False)
        self.qa_outputs = torch.nn.Linear(config.hidden_size, 2)
        self.code_presence = torch.nn.Linear(config.hidden_size * 2, 1)
        if getattr(config, "sms_token_head", False):
            self.code_tokens = torch.nn.Linear(config.hidden_size, 1)
        self.dropout = torch.nn.Dropout(config.hidden_dropout_prob)
        self.post_init()

    def forward(
        self, input_ids, attention_mask, start_positions=None, end_positions=None
    ):
        encoded = self.bert(
            input_ids=input_ids, attention_mask=attention_mask
        ).last_hidden_state
        logits = self.qa_outputs(encoded)
        starts, ends = logits.unbind(dim=-1)
        mask = attention_mask.unsqueeze(-1).to(encoded.dtype)
        pooled = (encoded * mask).sum(dim=1) / mask.sum(dim=1).clamp_min(1)
        presence = self.code_presence(
            self.dropout(torch.cat((encoded[:, 0], pooled), dim=-1))
        ).squeeze(-1)
        tokenLogits = None
        if hasattr(self, "code_tokens"):
            tokenLogits = self.code_tokens(self.dropout(encoded)).squeeze(-1)
        loss = None
        if start_positions is not None:
            positive = (start_positions != 0).to(starts.dtype)
            # Negative messages supervise presence and optional token validity.
            # Span localization does not compete with a CLS no-code endpoint.
            spanLoss = (
                F.cross_entropy(starts, start_positions, reduction="none")
                + F.cross_entropy(ends, end_positions, reduction="none")
            ) / 2
            loss = (spanLoss * positive).sum() / positive.sum().clamp_min(1)
            presenceWeight = 0.25 if tokenLogits is not None else 1.0
            loss = loss + presenceWeight * F.binary_cross_entropy_with_logits(
                presence, positive
            )
            if tokenLogits is not None:
                positions = torch.arange(input_ids.shape[1], device=input_ids.device)
                labels = (
                    (positions >= start_positions.unsqueeze(1))
                    & (positions <= end_positions.unsqueeze(1))
                    & positive.bool().unsqueeze(1)
                ).to(encoded.dtype)
                tokenLoss = F.binary_cross_entropy_with_logits(
                    tokenLogits,
                    labels,
                    reduction="none",
                    pos_weight=encoded.new_tensor(4.0),
                )
                loss = loss + (
                    tokenLoss * attention_mask
                ).sum() / attention_mask.sum().clamp_min(1)
        return SmsExtractionOutput(
            loss=loss,
            start_logits=starts,
            end_logits=ends,
            presence_logits=presence,
            code_token_logits=tokenLogits,
        )
