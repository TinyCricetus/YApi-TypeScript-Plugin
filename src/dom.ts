
export interface HTMLDivProps {
  id?: string
  class?: string
  text?: string
  onClick?: (event: MouseEvent) => void
}

export function createDiv(props: HTMLDivProps) {
  const div = document.createElement('div')
  div.innerText = props.text || ''

  if (props.id) {
    div.id = props.id
  }

  if (props.class) {
    div.className = props.class
  }

  if (props.onClick) {
    div.addEventListener('click', event => {
      props.onClick?.(event)
    })
  }

  return div
}