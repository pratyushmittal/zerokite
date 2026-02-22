_zerokite()
{
  local cur prev cmd sub
  cur="${COMP_WORDS[COMP_CWORD]}"
  prev="${COMP_WORDS[COMP_CWORD-1]}"
  cmd="${COMP_WORDS[1]}"
  sub="${COMP_WORDS[2]}"

  local top_commands="help version completion auth login verify profile holdings positions orders"
  local global_flags="--json"

  if [[ ${COMP_CWORD} -eq 1 ]]; then
    COMPREPLY=( $(compgen -W "${top_commands}" -- "${cur}") )
    return 0
  fi

  case "${cmd}" in
    completion)
      COMPREPLY=( $(compgen -W "bash zsh" -- "${cur}") )
      return 0
      ;;
    auth|login)
      COMPREPLY=( $(compgen -W "-p --port ${global_flags}" -- "${cur}") )
      return 0
      ;;
    verify|profile|holdings)
      COMPREPLY=( $(compgen -W "${global_flags}" -- "${cur}") )
      return 0
      ;;
    positions)
      COMPREPLY=( $(compgen -W "--day --net ${global_flags}" -- "${cur}") )
      return 0
      ;;
    orders)
      if [[ ${COMP_CWORD} -eq 2 ]]; then
        COMPREPLY=( $(compgen -W "list place modify cancel" -- "${cur}") )
        return 0
      fi

      case "${sub}" in
        list)
          COMPREPLY=( $(compgen -W "${global_flags}" -- "${cur}") )
          return 0
          ;;
        place)
          COMPREPLY=( $(compgen -W "--variety --exchange --tradingsymbol --transaction_type --quantity --order_type --product --price --trigger_price --validity --disclosed_quantity --tag ${global_flags}" -- "${cur}") )
          return 0
          ;;
        modify)
          COMPREPLY=( $(compgen -W "--order_id --variety --quantity --price --trigger_price --validity --disclosed_quantity --order_type ${global_flags}" -- "${cur}") )
          return 0
          ;;
        cancel)
          COMPREPLY=( $(compgen -W "--order_id --variety --parent_order_id ${global_flags}" -- "${cur}") )
          return 0
          ;;
      esac
      ;;
  esac

  COMPREPLY=()
}

complete -F _zerokite zerokite
