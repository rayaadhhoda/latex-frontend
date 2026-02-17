from pathlib import Path

def load_dataset(context: dict) -> None:
  dataset_list = []
  path = Path(__file__).parent / "dataset"
  for dataset in path.iterdir():
    if dataset.is_dir():
      dataset_list.append(dataset.name)
  context['dataset'] = dataset_list
  context['dataset_count'] = len(dataset_list)
