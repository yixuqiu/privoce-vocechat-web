// import React from "react";
import { useEffect, useState } from "react";
import styled from "styled-components";
// import { useDispatch } from "react-redux";
import Input from "../styled/Input";
// import BASE_URL from "../../app/config";
import { useUpdateInfoMutation } from "../../../app/services/contact";
import StyledModal from "../styled/Modal";
import Button from "../styled/Button";
const StyledEdit = styled(StyledModal)`
  .input {
    margin: 48px 0;
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 8px;
    label {
      font-weight: 600;
      font-size: 14px;
      line-height: 20px;
      color: #6b7280;
    }
  }
`;
import Modal from "../Modal";
import toast from "react-hot-toast";
export default function ProfileBasicEditModal({
  label = "Username",
  valueKey = "name",
  value = "",
  title = "Change your username",
  intro = "Enter a new username and your existing password.",
  closeModal,
}) {
  const [input, setInput] = useState(value);
  // const dispatch = useDispatch();
  const [update, { isLoading, isSuccess }] = useUpdateInfoMutation();
  const handleChange = (evt) => {
    setInput(evt.target.value);
  };
  const handleUpdate = () => {
    update({ [valueKey]: input });
  };
  useEffect(() => {
    if (isSuccess) {
      // todo
      toast.success("update user info successfully");
      closeModal();
    }
  }, [isSuccess]);
  return (
    <Modal id="modal-modal">
      <StyledEdit
        title={title}
        description={intro}
        buttons={
          <>
            <Button onClick={closeModal}>Cancel</Button>
            <Button onClick={handleUpdate} className="main">
              {isLoading ? "Updating" : `Done`}
            </Button>
          </>
        }
        className="animate__animated animate__fadeInDown animate__faster"
      >
        <div className="input">
          <label htmlFor={valueKey}>{label}</label>
          <Input name={valueKey} value={input} onChange={handleChange}></Input>
        </div>
      </StyledEdit>
    </Modal>
  );
}
