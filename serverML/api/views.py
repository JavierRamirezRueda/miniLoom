from rest_framework.decorators import api_view
from .models import Prompt, Branch, Block
from .serializers import PromptSerializer, BranchSerializer, BlockSerializer
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from transformers import AutoTokenizer, PhiForCausalLM, set_seed, BertTokenizer, BertForSequenceClassification
import torch

@api_view(['GET', 'POST'])
def handle_prompts(request):
    if request.method == 'GET':
        prompts = Prompt.objects.filter(**request.query_params.dict()) if (request.query_params) else Prompt.objects.all()
        if prompts:
            prompts_serialized = PromptSerializer(instance = prompts, many = True)
            return Response(prompts_serialized.data)
        return Response(status = status.HTTP_404_NOT_FOUND)
    
    elif request.method == 'POST':
        prompt_serialized = PromptSerializer(data = request.data)
        if prompt_serialized.is_valid():
            prompt_serialized.save()
            return Response(prompt_serialized.data)
        return Response(status = status.HTTP_404_NOT_FOUND)

@api_view(['GET', 'PUT', 'DELETE'])
def handle_prompts_by_id(request, pk):
    prompt = get_object_or_404(klass = Prompt, pk = pk)
    if request.method == 'GET':
        prompt_serialized = PromptSerializer(instance = prompt)
        return Response(prompt_serialized.data)

    elif request.method == 'PUT':
        prompt_serialized = PromptSerializer(instance = prompt, data = request.data)
        if prompt_serialized.is_valid():
            prompt_serialized.save()
            return Response(prompt_serialized.data)
        return Response(status = status.HTTP_404_NOT_FOUND)

    elif request.method == 'DELETE':
        prompt.delete()
        return Response(status = status.HTTP_202_ACCEPTED)

@api_view(['GET', 'POST'])
def handle_branches(request):
    if request.method == 'GET':
        branches = Branch.objects.filter(**request.query_params.dict()) if (request.query_params) else Branch.objects.all()
        if branches:
            branches_serialized = BranchSerializer(instance = branches, many = True)
            return Response(branches_serialized.data)
        return Response(status = status.HTTP_404_NOT_FOUND)
    
    elif request.method == 'POST':
        branch_serialized = BranchSerializer(data = request.data)
        if branch_serialized.is_valid():
            branch_serialized.save()
            return Response(branch_serialized.data)
        return Response(status = status.HTTP_404_NOT_FOUND)

@api_view(['GET', 'PUT', 'DELETE'])
def handle_branches_by_id(request, pk):
    branch = get_object_or_404(klass = Branch, pk = pk)
    if request.method == 'GET':
        branch_serialized = BranchSerializer(instance = branch)
        return Response(branch_serialized.data)

    elif request.method == 'PUT':
        branch_serialized = BranchSerializer(instance = branch, data = request.data)
        if branch_serialized.is_valid():
            branch_serialized.save()
            return Response(branch_serialized.data)
        return Response(status = status.HTTP_404_NOT_FOUND)

    elif request.method == 'DELETE':
        branch.delete()
        return Response(status = status.HTTP_202_ACCEPTED)

@api_view(['GET', 'POST', 'DELETE'])
def handle_blocks(request):
    if request.method == 'GET':
        blocks = Block.objects.filter(**request.query_params.dict()) if (request.query_params) else Block.objects.all()
        if blocks:
            blocks_serialized = BlockSerializer(instance = blocks, many = True)
            return Response(blocks_serialized.data)
        return Response(status = status.HTTP_404_NOT_FOUND)
    
    elif request.method == 'POST':
        block_serialized = BlockSerializer(data = request.data)
        if block_serialized.is_valid():
            block_serialized.save()
            return Response(block_serialized.data)
        return Response(status = status.HTTP_404_NOT_FOUND)
    
    elif request.method == 'DELETE':
        blocks = Block.objects.filter(**request.query_params.dict())
        if blocks:
            blocks.delete()
            return Response(status = status.HTTP_202_ACCEPTED)
        return Response(status = status.HTTP_404_NOT_FOUND)
    
@api_view(['GET', 'PUT', 'DELETE'])
def handle_blocks_by_id(request, pk):
    block = get_object_or_404(klass = Block, pk = pk)
    if request.method == 'GET':
        block_serialized = BlockSerializer(instance = block)
        return Response(block_serialized.data)

    elif request.method == 'PUT':
        block_serialized = BlockSerializer(instance = block, data = request.data)
        if block_serialized.is_valid():
            block_serialized.save()
            return Response(block_serialized.data)
        return Response(status = status.HTTP_404_NOT_FOUND)

    elif request.method == 'DELETE':
        block.delete()
        return Response(status = status.HTTP_202_ACCEPTED)
    
tokenizer1 = AutoTokenizer.from_pretrained("phi-1_5/model", local_files_only = True)
tokenizer1.pad_token = tokenizer1.eos_token

if torch.cuda.is_available():
    model1 = PhiForCausalLM.from_pretrained("phi-1_5/model", torch_dtype = torch.float16, local_files_only = True)
    model1 = model1.to(torch.device("cuda"))
else:
    model1 = PhiForCausalLM.from_pretrained("phi-1_5/model", local_files_only = True)

@api_view(['POST'])
def generate(request):
    inputs1 = tokenizer1.tokenize(request.data["prompt"])
    inputs2 = tokenizer1.tokenize(request.data["text"])
    if 2048 < (len(inputs1) + len(inputs2) + request.data["max_new_tokens"]):
        inputs2 = inputs2[((len(inputs1) + len(inputs2) + request.data["max_new_tokens"]) - 2048):]

    inputs = torch.tensor([tokenizer1.convert_tokens_to_ids(inputs1 + inputs2)])
    print(tokenizer1.decode(inputs[0]))
    if torch.cuda.is_available():
        inputs = inputs.to(torch.device("cuda"))

    if "seed" in request.data:
        set_seed(request.data["seed"])

    outputs = model1.generate(inputs, max_new_tokens = request.data["max_new_tokens"], temperature= float(request.data["temperature"]), top_k= request.data["top_k"],  top_p=float(request.data["top_p"]), do_sample = True)
    return Response(tokenizer1.decode(outputs[0])[len(tokenizer1.decode(inputs[0])):])

tokenizer2 = BertTokenizer.from_pretrained("bert-base-uncased/model", local_files_only = True)
model2 = BertForSequenceClassification.from_pretrained("bert-base-uncased/model", local_files_only = True)

@api_view(['POST'])
def discriminate(request):
    inputs = tokenizer2.encode(request.data["text"], return_tensors = "pt")
    outputs = model2(inputs)

    outputs_normalized = torch.nn.functional.softmax(outputs.logits, dim = -1)
    return Response(True if (float(request.data["threshold"]) <= outputs_normalized[0][1].item()) else False)
